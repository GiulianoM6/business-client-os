-- Enforcement remains OFF until an operator completes the documented staging checks.
begin;
create function public.commerce_access_allowed()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from commerce_private.settings c where c.id and (
      not c.enforced or (
        exists(select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null)
        and (
          exists(select 1 from commerce_private.access_exemptions e where e.user_id = auth.uid() and e.expires_at > now())
          or exists(select 1 from commerce_private.entitlements e
            join commerce_private.purchases p on p.id = e.purchase_id and p.user_id = e.user_id
            where e.user_id = auth.uid() and e.active and p.state = 'paid' and p.total_minor > 0
              and (not p.test_mode or c.allow_test_purchases))
        )
      )
    )
  );
$$;
revoke all on function public.commerce_access_allowed() from public, anon;
grant execute on function public.commerce_access_allowed() to authenticated;

-- Cover browser Supabase REST reads/writes as well as ordinary server queries.
do $$
declare t text;
begin
  foreach t in array array['workspaces','memberships','clients','leads','projects','tasks','followups','money_entries','invoices','notifications'] loop
    execute format('create policy lifetime_access_required on public.%I as restrictive for all to authenticated using (public.commerce_access_allowed()) with check (public.commerce_access_allowed())', t);
  end loop;
end $$;

-- These pre-existing SECURITY DEFINER helpers must also respect the paywall.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.commerce_access_allowed() and exists(select 1 from public.memberships where workspace_id = target_workspace_id and user_id = auth.uid());
$$;
create or replace function public.workspace_role(target_workspace_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.memberships where workspace_id = target_workspace_id and user_id = auth.uid() and public.commerce_access_allowed() limit 1;
$$;
create or replace function public.create_workspace(workspace_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_workspace_id uuid;
begin
  if auth.uid() is null or not public.commerce_access_allowed() then raise exception 'Access denied'; end if;
  if workspace_name is null or length(trim(workspace_name)) not between 1 and 100 then raise exception 'Workspace name is required'; end if;
  insert into public.workspaces(name,created_by) values(trim(workspace_name),auth.uid()) returning id into new_workspace_id;
  insert into public.memberships(workspace_id,user_id,role) values(new_workspace_id,auth.uid(),'owner');
  return new_workspace_id;
end;
$$;
revoke all on function public.create_workspace(text), public.is_workspace_member(uuid), public.workspace_role(uuid) from public, anon;
grant execute on function public.create_workspace(text), public.is_workspace_member(uuid), public.workspace_role(uuid) to authenticated;
commit;
