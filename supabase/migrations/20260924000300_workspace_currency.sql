-- BUSINESS CLIENT OS
-- Workspace-level default currency (GBP / EUR / USD)

alter table public.workspaces
  add column if not exists default_currency text not null default 'GBP';

update public.workspaces
set default_currency = upper(default_currency)
where default_currency is not null;

alter table public.workspaces
  drop constraint if exists workspaces_default_currency_check;

alter table public.workspaces
  add constraint workspaces_default_currency_check
  check (default_currency in ('GBP','EUR','USD'));
