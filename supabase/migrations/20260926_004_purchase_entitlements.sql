-- Business Client OS
-- Purchase ledger + lifetime access entitlements
-- Lemon Squeezy integration foundation

-- =========================================================
-- 1. PURCHASES
-- =========================================================

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'lemonsqueezy'
    check (provider in ('lemonsqueezy')),

  provider_order_id text not null,
  provider_identifier text,

  product_id text not null,
  variant_id text,

  purchaser_email text not null,
  user_id uuid references auth.users(id) on delete set null,

  currency text not null,
  total integer not null default 0
    check (total >= 0),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'paid',
        'refunded',
        'partially_refunded',
        'void',
        'revoked'
      )
    ),

  purchased_at timestamptz,
  refunded_at timestamptz,
  revoked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (provider, provider_order_id)
);

create index if not exists purchases_user_id_idx
on public.purchases(user_id);

create index if not exists purchases_email_idx
on public.purchases(lower(purchaser_email));

create index if not exists purchases_status_idx
on public.purchases(status);


-- =========================================================
-- 2. WEBHOOK EVENTS
-- Used for idempotency / duplicate protection
-- =========================================================

create table if not exists public.commerce_webhook_events (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'lemonsqueezy'
    check (provider in ('lemonsqueezy')),

  event_key text not null,
  event_name text not null,

  provider_object_id text,

  processed boolean not null default false,
  processing_error text,

  received_at timestamptz not null default now(),
  processed_at timestamptz,

  unique (provider, event_key)
);

create index if not exists commerce_webhook_events_object_idx
on public.commerce_webhook_events(provider, provider_object_id);


-- =========================================================
-- 3. LIFETIME ENTITLEMENTS
-- =========================================================

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,

  product_key text not null default 'business-client-os-lifetime',

  status text not null default 'active'
    check (status in ('active', 'revoked')),

  granted_at timestamptz not null default now(),
  revoked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, product_key)
);

create index if not exists entitlements_user_id_idx
on public.entitlements(user_id);

create index if not exists entitlements_purchase_id_idx
on public.entitlements(purchase_id);


-- =========================================================
-- 4. UPDATED_AT TRIGGERS
-- Uses existing public.set_updated_at()
-- =========================================================

drop trigger if exists purchases_set_updated_at
on public.purchases;

create trigger purchases_set_updated_at
before update on public.purchases
for each row
execute function public.set_updated_at();


drop trigger if exists entitlements_set_updated_at
on public.entitlements;

create trigger entitlements_set_updated_at
before update on public.entitlements
for each row
execute function public.set_updated_at();


-- =========================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================

alter table public.purchases enable row level security;
alter table public.entitlements enable row level security;
alter table public.commerce_webhook_events enable row level security;


-- =========================================================
-- 6. PURCHASE POLICIES
-- Users may only see purchases already linked to their account.
-- Browser clients cannot insert/update/delete purchase records.
-- Server-side service role handles payment mutations.
-- =========================================================

drop policy if exists "Users can view own purchases"
on public.purchases;

create policy "Users can view own purchases"
on public.purchases
for select
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 7. ENTITLEMENT POLICIES
-- =========================================================

drop policy if exists "Users can view own entitlements"
on public.entitlements;

create policy "Users can view own entitlements"
on public.entitlements
for select
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 8. NO CLIENT ACCESS TO WEBHOOK LEDGER
-- No authenticated policies are intentionally created.
-- Only trusted server/service-role code may access it.
-- =========================================================


-- =========================================================
-- 9. ACCESS CHECK FUNCTION
-- =========================================================

create or replace function public.has_lifetime_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entitlements e
    join public.purchases p
      on p.id = e.purchase_id
    where e.user_id = auth.uid()
      and e.product_key = 'business-client-os-lifetime'
      and e.status = 'active'
      and e.revoked_at is null
      and p.status = 'paid'
      and p.revoked_at is null
  );
$$;

grant execute
on function public.has_lifetime_access()
to authenticated;


-- =========================================================
-- 10. SECURITY
-- Prevent normal clients from mutating commerce records.
-- Service role bypasses RLS and is used by verified webhooks.
-- =========================================================

revoke insert, update, delete
on public.purchases
from authenticated;

revoke insert, update, delete
on public.entitlements
from authenticated;

revoke all
on public.commerce_webhook_events
from authenticated;