-- BUSINESS CLIENT OS
-- V1 foundation: profiles, workspaces, memberships, clients, leads + RLS

create extension if not exists pgcrypto;

-- =========================================================
-- 1. PROFILES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 2. WORKSPACES
-- =========================================================

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 3. MEMBERSHIPS
-- =========================================================

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),

  unique (workspace_id, user_id)
);

-- =========================================================
-- 4. CLIENTS
-- =========================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  name text not null,
  company text,
  email text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  notes text,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_workspace_id_idx
on public.clients(workspace_id);

-- =========================================================
-- 5. LEADS
-- =========================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,

  name text not null,
  company text,
  email text,
  phone text,

  status text not null default 'new'
    check (
      status in (
        'new',
        'contacted',
        'qualified',
        'proposal',
        'negotiation',
        'won',
        'lost'
      )
    ),

  estimated_value integer not null default 0
    check (estimated_value >= 0),

  currency text not null default 'GBP',
  notes text,

  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_workspace_id_idx
on public.leads(workspace_id);

-- =========================================================
-- 6. UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- =========================================================
-- 7. AUTO-CREATE PROFILE WHEN USER SIGNS UP
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profile for users that already exist
insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  email,
  raw_user_meta_data ->> 'full_name',
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- =========================================================
-- 8. SECURITY HELPER FUNCTIONS
-- =========================================================

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(target_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.memberships
  where workspace_id = target_workspace_id
    and user_id = auth.uid()
  limit 1;
$$;

-- =========================================================
-- 9. CREATE WORKSPACE RPC
-- Creates workspace + owner membership atomically
-- =========================================================

create or replace function public.create_workspace(
  workspace_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if trim(workspace_name) = '' then
    raise exception 'Workspace name is required';
  end if;

  insert into public.workspaces (
    name,
    created_by
  )
  values (
    trim(workspace_name),
    auth.uid()
  )
  returning id into new_workspace_id;

  insert into public.memberships (
    workspace_id,
    user_id,
    role
  )
  values (
    new_workspace_id,
    auth.uid(),
    'owner'
  );

  return new_workspace_id;
end;
$$;

grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.workspace_role(uuid) to authenticated;

-- =========================================================
-- 10. ENABLE RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.clients enable row level security;
alter table public.leads enable row level security;

-- =========================================================
-- 11. PROFILES POLICIES
-- =========================================================

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- =========================================================
-- 12. WORKSPACES POLICIES
-- =========================================================

drop policy if exists "Members can view workspaces" on public.workspaces;
create policy "Members can view workspaces"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "Owners and admins can update workspaces" on public.workspaces;
create policy "Owners and admins can update workspaces"
on public.workspaces
for update
to authenticated
using (
  public.workspace_role(id) in ('owner', 'admin')
)
with check (
  public.workspace_role(id) in ('owner', 'admin')
);

drop policy if exists "Owners can delete workspaces" on public.workspaces;
create policy "Owners can delete workspaces"
on public.workspaces
for delete
to authenticated
using (
  public.workspace_role(id) = 'owner'
);

-- =========================================================
-- 13. MEMBERSHIPS POLICIES
-- =========================================================

drop policy if exists "Members can view memberships" on public.memberships;
create policy "Members can view memberships"
on public.memberships
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists "Owners and admins can add members" on public.memberships;
create policy "Owners and admins can add members"
on public.memberships
for insert
to authenticated
with check (
  public.workspace_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "Owners and admins can update members" on public.memberships;
create policy "Owners and admins can update members"
on public.memberships
for update
to authenticated
using (
  public.workspace_role(workspace_id) in ('owner', 'admin')
)
with check (
  public.workspace_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "Owners and admins can remove members" on public.memberships;
create policy "Owners and admins can remove members"
on public.memberships
for delete
to authenticated
using (
  public.workspace_role(workspace_id) in ('owner', 'admin')
);

-- =========================================================
-- 14. CLIENTS POLICIES
-- =========================================================

drop policy if exists "Members can view clients" on public.clients;
create policy "Members can view clients"
on public.clients
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists "Members can create clients" on public.clients;
create policy "Members can create clients"
on public.clients
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
);

drop policy if exists "Members can update clients" on public.clients;
create policy "Members can update clients"
on public.clients
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
)
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
);

drop policy if exists "Members can delete clients" on public.clients;
create policy "Members can delete clients"
on public.clients
for delete
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
);

-- =========================================================
-- 15. LEADS POLICIES
-- =========================================================

drop policy if exists "Members can view leads" on public.leads;
create policy "Members can view leads"
on public.leads
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists "Members can create leads" on public.leads;
create policy "Members can create leads"
on public.leads
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
);

drop policy if exists "Members can update leads" on public.leads;
create policy "Members can update leads"
on public.leads
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
)
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
);

drop policy if exists "Members can delete leads" on public.leads;
create policy "Members can delete leads"
on public.leads
for delete
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_role(workspace_id) in ('owner', 'admin', 'member')
);
