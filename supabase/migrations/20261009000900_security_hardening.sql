begin;

-- Trigger and event-trigger helpers are internal implementation details.
-- They should not be callable through the exposed API roles.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- The legacy entitlement helper is only used internally by the canonical
-- commerce access functions. Keep it out of the API surface.
revoke all on function public.has_lifetime_access() from public, anon, authenticated;

-- Pin the trigger helper search path to avoid role-dependent resolution.
alter function public.set_updated_at() set search_path = pg_catalog, public;

commit;
