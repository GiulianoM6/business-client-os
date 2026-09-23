-- BUSINESS CLIENT OS
-- V1 operational modules: projects, tasks, follow-ups, money, invoices, notifications

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  status text not null default 'planned' check (status in ('planned','active','on_hold','completed','cancelled')),
  due_date date,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','done','cancelled')),
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(client_id, lead_id) <= 1)
);

create table if not exists public.money_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  direction text not null check (direction in ('income','expense')),
  amount integer not null check (amount >= 0),
  currency text not null default 'GBP',
  category text not null default 'Other',
  description text,
  occurred_on date not null default current_date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  number text not null,
  amount integer not null default 0 check (amount >= 0),
  currency text not null default 'GBP',
  status text not null default 'draft' check (status in ('draft','sent','paid','void')),
  issue_date date,
  due_date date,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, number)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_workspace_idx on public.projects(workspace_id);
create index if not exists tasks_workspace_idx on public.tasks(workspace_id);
create index if not exists followups_workspace_idx on public.followups(workspace_id);
create index if not exists money_entries_workspace_idx on public.money_entries(workspace_id);
create index if not exists invoices_workspace_idx on public.invoices(workspace_id);
create index if not exists notifications_workspace_idx on public.notifications(workspace_id, recipient_user_id);

do $$
declare t text;
begin
  foreach t in array array['projects','tasks','followups','money_entries','invoices']
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.followups enable row level security;
alter table public.money_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','tasks','followups','money_entries','invoices']
  loop
    execute format('drop policy if exists "workspace read" on public.%I', t);
    execute format('create policy "workspace read" on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', t);
    execute format('drop policy if exists "workspace insert" on public.%I', t);
    execute format('create policy "workspace insert" on public.%I for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = auth.uid() and public.workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t);
    execute format('drop policy if exists "workspace update" on public.%I', t);
    execute format('create policy "workspace update" on public.%I for update to authenticated using (public.workspace_role(workspace_id) in (''owner'',''admin'',''member'')) with check (public.workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t);
    execute format('drop policy if exists "workspace delete" on public.%I', t);
    execute format('create policy "workspace delete" on public.%I for delete to authenticated using (public.workspace_role(workspace_id) in (''owner'',''admin'',''member''))', t);
  end loop;
end $$;

drop policy if exists "notification read" on public.notifications;
create policy "notification read" on public.notifications for select to authenticated
using (public.is_workspace_member(workspace_id) and recipient_user_id = auth.uid());

drop policy if exists "notification update" on public.notifications;
create policy "notification update" on public.notifications for update to authenticated
using (public.is_workspace_member(workspace_id) and recipient_user_id = auth.uid())
with check (public.is_workspace_member(workspace_id) and recipient_user_id = auth.uid());


-- Finance is restricted to owners/admins.
drop policy if exists "workspace read" on public.money_entries;
create policy "workspace read" on public.money_entries for select to authenticated
using (public.workspace_role(workspace_id) in ('owner','admin'));
drop policy if exists "workspace insert" on public.money_entries;
create policy "workspace insert" on public.money_entries for insert to authenticated
with check (created_by = auth.uid() and public.workspace_role(workspace_id) in ('owner','admin'));
drop policy if exists "workspace update" on public.money_entries;
create policy "workspace update" on public.money_entries for update to authenticated
using (public.workspace_role(workspace_id) in ('owner','admin'))
with check (public.workspace_role(workspace_id) in ('owner','admin'));
drop policy if exists "workspace delete" on public.money_entries;
create policy "workspace delete" on public.money_entries for delete to authenticated
using (public.workspace_role(workspace_id) in ('owner','admin'));

drop policy if exists "workspace read" on public.invoices;
create policy "workspace read" on public.invoices for select to authenticated
using (public.workspace_role(workspace_id) in ('owner','admin'));
drop policy if exists "workspace insert" on public.invoices;
create policy "workspace insert" on public.invoices for insert to authenticated
with check (created_by = auth.uid() and public.workspace_role(workspace_id) in ('owner','admin'));
drop policy if exists "workspace update" on public.invoices;
create policy "workspace update" on public.invoices for update to authenticated
using (public.workspace_role(workspace_id) in ('owner','admin'))
with check (public.workspace_role(workspace_id) in ('owner','admin'));
drop policy if exists "workspace delete" on public.invoices;
create policy "workspace delete" on public.invoices for delete to authenticated
using (public.workspace_role(workspace_id) in ('owner','admin'));
