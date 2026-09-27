-- Additive commerce schema. No existing users are blocked by this migration.
begin;
create schema if not exists commerce_private;
revoke all on schema commerce_private from public, anon, authenticated, service_role;

create table commerce_private.settings (
  id boolean primary key default true check (id),
  enforced boolean not null default false,
  allow_test_purchases boolean not null default false
);
insert into commerce_private.settings(id) values (true);

create table commerce_private.access_exemptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null check (length(reason) between 1 and 500),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table commerce_private.purchases (
  id uuid primary key default gen_random_uuid(),
  store_id text not null check (store_id ~ '^[0-9]+$'),
  order_id text not null check (order_id ~ '^[0-9]+$'),
  test_mode boolean not null,
  user_id uuid references auth.users(id),
  variant_id text not null check (variant_id ~ '^[0-9]+$'),
  state text not null check (state in ('pending','failed','paid','refunded','fraudulent')),
  total_minor bigint not null check (total_minor between 0 and 1000000000000),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  provider_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, test_mode, order_id)
);
create index purchases_user_idx on commerce_private.purchases(user_id);

create table commerce_private.entitlements (
  purchase_id uuid primary key references commerce_private.purchases(id),
  user_id uuid not null references auth.users(id),
  active boolean not null,
  updated_at timestamptz not null default now()
);
create index entitlements_user_idx on commerce_private.entitlements(user_id) where active;

-- Minimal append-only receipts double as audit and replay protection. No raw customer payload.
create table commerce_private.webhook_events (
  digest text primary key check (digest ~ '^[a-f0-9]{64}$'),
  purchase_id uuid not null references commerce_private.purchases(id),
  event_name text not null check (event_name in ('order_created','order_refunded')),
  resulting_state text not null,
  received_at timestamptz not null default now()
);
alter table commerce_private.settings enable row level security;
alter table commerce_private.access_exemptions enable row level security;
alter table commerce_private.purchases enable row level security;
alter table commerce_private.entitlements enable row level security;
alter table commerce_private.webhook_events enable row level security;
revoke all on all tables in schema commerce_private from public, anon, authenticated, service_role;

-- Only the signed provider endpoint may invoke this atomic write path.
create function public.record_lemon_order(event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p commerce_private.purchases%rowtype;
  bound_user uuid := nullif(event->>'user_id','')::uuid;
  incoming_state text := event->>'state';
  incoming_time timestamptz := (event->>'updated_at')::timestamptz;
begin
  if event->>'event_name' not in ('order_created','order_refunded')
    or incoming_state not in ('pending','failed','paid','refunded','fraudulent')
    or event->>'digest' is null or incoming_state is null or incoming_time is null
    or event->>'event_name' is null then raise exception 'Invalid commerce event'; end if;
  if event->>'event_name' = 'order_refunded' and incoming_state <> 'refunded' then
    raise exception 'Invalid refund state';
  end if;
  -- Serializes concurrent first insert, duplicate, refund and paid delivery for an order.
  perform pg_advisory_xact_lock(hashtextextended(concat(event->>'store_id', ':', event->>'test_mode', ':', event->>'order_id'), 0));
  if exists(select 1 from commerce_private.webhook_events where digest = event->>'digest') then
    return jsonb_build_object('duplicate', true);
  end if;
  select * into p from commerce_private.purchases where store_id = event->>'store_id'
    and test_mode = (event->>'test_mode')::boolean and order_id = event->>'order_id' for update;
  if found then
    if p.variant_id <> event->>'variant_id' or p.currency <> event->>'currency'
      or (bound_user is not null and p.user_id is not null and p.user_id <> bound_user) then
      raise exception 'Order identity conflict';
    end if;
    -- Refund/fraud tombstones are terminal, including refunds arriving before payment.
    if p.state not in ('refunded','fraudulent') and
      (incoming_state in ('refunded','fraudulent') or incoming_time > p.provider_updated_at) then
      update commerce_private.purchases set state = incoming_state,
        total_minor = (event->>'total_minor')::bigint,
        provider_updated_at = greatest(provider_updated_at, incoming_time), updated_at = now()
      where id = p.id returning * into p;
    end if;
  else
    if incoming_state = 'paid' and (bound_user is null or (event->>'total_minor')::bigint <= 0) then
      raise exception 'Paid order requires verified account and positive amount';
    end if;
    if bound_user is not null and not exists(select 1 from auth.users where id = bound_user and email_confirmed_at is not null) then
      raise exception 'Account is not verified';
    end if;
    insert into commerce_private.purchases(store_id,order_id,test_mode,user_id,variant_id,state,total_minor,currency,provider_updated_at)
    values(event->>'store_id',event->>'order_id',(event->>'test_mode')::boolean,bound_user,event->>'variant_id',incoming_state,
      (event->>'total_minor')::bigint,event->>'currency',incoming_time) returning * into p;
  end if;
  if p.user_id is not null then
    insert into commerce_private.entitlements(purchase_id,user_id,active)
    values(p.id,p.user_id,p.state = 'paid' and p.total_minor > 0)
    on conflict(purchase_id) do update set active = excluded.active, updated_at = now();
  end if;
  insert into commerce_private.webhook_events(digest,purchase_id,event_name,resulting_state)
    values(event->>'digest',p.id,event->>'event_name',p.state);
  return jsonb_build_object('duplicate',false,'state',p.state);
end;
$$;
revoke all on function public.record_lemon_order(jsonb) from public, anon, authenticated;
grant execute on function public.record_lemon_order(jsonb) to service_role;

-- User-scoped, read-only status. An exemption/disabled paywall is never a paid purchase.
create function public.my_lifetime_access()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  cfg commerce_private.settings%rowtype;
  p commerce_private.purchases%rowtype;
  verified boolean;
  exempt boolean;
  confirmed boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into strict cfg from commerce_private.settings where id;
  select exists(select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) into confirmed;
  select x.* into p from commerce_private.purchases x
    join commerce_private.entitlements e on e.purchase_id = x.id and e.user_id = auth.uid()
    where x.user_id = auth.uid() and (not x.test_mode or cfg.allow_test_purchases)
    order by (e.active and x.state = 'paid') desc, x.created_at desc, x.id limit 1;
  verified := confirmed and coalesce(p.state = 'paid' and p.total_minor > 0, false);
  select exists(select 1 from commerce_private.access_exemptions where user_id = auth.uid() and expires_at > now()) into exempt;
  return jsonb_build_object('enforced',cfg.enforced,'allowed',confirmed and (not cfg.enforced or verified or exempt),
    'state',case when verified then 'verified' when p.state in ('refunded','fraudulent') then 'refunded' else 'pending' end,
    'purchase',case when verified then jsonb_build_object('id',p.id,'total_minor',p.total_minor,'currency',p.currency,'test_mode',p.test_mode) else null end);
end;
$$;
revoke all on function public.my_lifetime_access() from public, anon;
grant execute on function public.my_lifetime_access() to authenticated;
commit;
