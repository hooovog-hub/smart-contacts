-- 0002: helper functions for RLS move to a private schema (not exposed via the Data API),
-- trigger function is not callable via RPC. Fixes Supabase security advisor warnings 0028/0029.
create schema if not exists private;
grant usage on schema private to anon, authenticated;
alter function public.is_room_member(uuid) set schema private;
alter function public.is_team_member(uuid) set schema private;
alter function public.is_paid(uuid) set schema private;
revoke execute on function public.seed_categories() from public, anon, authenticated;
