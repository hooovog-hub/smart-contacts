-- 0013 (SC-100): explicit consent before contact data goes to the AI provider (Apple 5.1.2(i)).
-- A row = the user allowed AI features; deleting it switches AI off. Edge Functions check it before
-- calling Claude (supabase/functions/_shared/guard.ts → consume()).

create table if not exists public.ai_consents (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table public.ai_consents enable row level security;

drop policy if exists "ai_consents own read" on public.ai_consents;
create policy "ai_consents own read" on public.ai_consents for select to authenticated
  using ((select auth.uid()) = profile_id);
drop policy if exists "ai_consents own insert" on public.ai_consents;
create policy "ai_consents own insert" on public.ai_consents for insert to authenticated
  with check ((select auth.uid()) = profile_id);
drop policy if exists "ai_consents own delete" on public.ai_consents;
create policy "ai_consents own delete" on public.ai_consents for delete to authenticated
  using ((select auth.uid()) = profile_id);

revoke all on public.ai_consents from anon;
