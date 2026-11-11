-- 0007: crash / error reports from the mobile app (and Edge Functions), stored in our own database.
-- Write-only for clients: anyone may insert a bounded report, nobody can read reports through the API
-- (read them in the Supabase dashboard / SQL editor). No contact data must be put into reports.

create table if not exists public.client_errors (
  id          bigint generated always as identity primary key,
  owner_id    uuid default auth.uid(), -- no FK: reports must save even before the profile exists
  source      text not null default 'mobile' check (source in ('mobile', 'web', 'edge')),
  message     text not null check (char_length(message) between 1 and 1000),
  stack       text check (char_length(stack) <= 8000),
  fatal       boolean not null default false,
  app_version text check (char_length(app_version) <= 40),
  platform    text check (char_length(platform) <= 40),
  context     jsonb check (pg_column_size(context) <= 4000),
  created_at  timestamptz not null default now()
);
create index if not exists client_errors_created_idx on public.client_errors (created_at desc);
create index if not exists client_errors_owner_idx on public.client_errors (owner_id);

alter table public.client_errors enable row level security;
-- Insert only; a signed-in user may attach only their own id. No select/update/delete policies.
create policy "client_errors insert" on public.client_errors for insert to anon, authenticated
  with check (owner_id is null or owner_id = (select auth.uid()));
