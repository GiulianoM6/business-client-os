-- Temporary backward-compatibility bridge for legacy test entitlements.
-- Legacy public.purchases/public.entitlements are treated as TEST purchases only,
-- so they stop granting access automatically when allow_test_purchases is disabled.
begin;

create or replace function public.commerce_access_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from commerce_private.settings c
    where c.id
      and (
        not c.enforced
        or (
          exists (
            select 1
            from auth.users u
            where u.id = auth.uid()
              and u.email_confirmed_at is not null
          )
          and (
            exists (
              select 1
              from commerce_private.access_exemptions e
              where e.user_id = auth.uid()
                and e.expires_at > now()
            )
            or exists (
              select 1
              from commerce_private.entitlements e
              join commerce_private.purchases p
                on p.id = e.purchase_id
               and p.user_id = e.user_id
              where e.user_id = auth.uid()
                and e.active
                and p.state = 'paid'
                and p.total_minor > 0
                and (not p.test_mode or c.allow_test_purchases)
            )
            or (
              c.allow_test_purchases
              and public.has_lifetime_access()
            )
          )
        )
      )
  );
$$;

revoke all on function public.commerce_access_allowed() from public, anon;
grant execute on function public.commerce_access_allowed() to authenticated;

create or replace function public.my_lifetime_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cfg commerce_private.settings%rowtype;
  p commerce_private.purchases%rowtype;
  legacy_purchase public.purchases%rowtype;
  verified boolean;
  legacy_verified boolean := false;
  exempt boolean;
  confirmed boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into strict cfg
  from commerce_private.settings
  where id;

  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email_confirmed_at is not null
  ) into confirmed;

  select x.* into p
  from commerce_private.purchases x
  join commerce_private.entitlements e
    on e.purchase_id = x.id
   and e.user_id = auth.uid()
  where x.user_id = auth.uid()
    and (not x.test_mode or cfg.allow_test_purchases)
  order by (e.active and x.state = 'paid') desc, x.created_at desc, x.id
  limit 1;

  verified := confirmed
    and coalesce(p.state = 'paid' and p.total_minor > 0, false);

  if not verified and confirmed and cfg.allow_test_purchases then
    select lp.* into legacy_purchase
    from public.purchases lp
    join public.entitlements le
      on le.purchase_id = lp.id
     and le.user_id = auth.uid()
    where lp.user_id = auth.uid()
      and le.product_key = 'business-client-os-lifetime'
      and le.status = 'active'
      and le.revoked_at is null
      and lp.status = 'paid'
      and lp.revoked_at is null
      and lp.total > 0
    order by lp.created_at desc, lp.id
    limit 1;

    legacy_verified := found;
  end if;

  select exists (
    select 1
    from commerce_private.access_exemptions
    where user_id = auth.uid()
      and expires_at > now()
  ) into exempt;

  return jsonb_build_object(
    'enforced', cfg.enforced,
    'allowed', confirmed and (
      not cfg.enforced
      or verified
      or legacy_verified
      or exempt
    ),
    'state',
      case
        when verified or legacy_verified then 'verified'
        when p.state in ('refunded', 'fraudulent') then 'refunded'
        else 'pending'
      end,
    'purchase',
      case
        when verified then
          jsonb_build_object(
            'id', p.id,
            'total_minor', p.total_minor,
            'currency', p.currency,
            'test_mode', p.test_mode
          )
        when legacy_verified then
          jsonb_build_object(
            'id', legacy_purchase.id,
            'total_minor', legacy_purchase.total,
            'currency', legacy_purchase.currency,
            'test_mode', true
          )
        else null
      end
  );
end;
$$;

revoke all on function public.my_lifetime_access() from public, anon;
grant execute on function public.my_lifetime_access() to authenticated;

commit;
