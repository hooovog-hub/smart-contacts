-- 0014 (SC-101): «Пожаловаться» and «Заблокировать» on someone else's profile (Apple guideline 1.2).
-- Reports: write-only for users, read by the team in the Supabase dashboard (answer within 24 hours).
-- Blocks: the blocked person no longer sees the blocker's profile and cannot get their phone.

create table if not exists public.profile_reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_id   uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in ('spam', 'abuse', 'fake', 'other')),
  details     text check (char_length(details) <= 1000),
  status      text not null default 'new' check (status in ('new', 'reviewed', 'actioned')),
  created_at  timestamptz not null default now(),
  check (reporter_id <> target_id)
);
create index if not exists profile_reports_target_idx on public.profile_reports (target_id);
create index if not exists profile_reports_new_idx on public.profile_reports (created_at desc) where status = 'new';
alter table public.profile_reports enable row level security;
revoke all on public.profile_reports from anon;
create policy "profile_reports insert own" on public.profile_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id and status = 'new');

create table if not exists public.profile_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists profile_blocks_blocked_idx on public.profile_blocks (blocked_id);
alter table public.profile_blocks enable row level security;
revoke all on public.profile_blocks from anon;
create policy "profile_blocks own read" on public.profile_blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);
create policy "profile_blocks own insert" on public.profile_blocks for insert to authenticated
  with check ((select auth.uid()) = blocker_id);
create policy "profile_blocks own delete" on public.profile_blocks for delete to authenticated
  using ((select auth.uid()) = blocker_id);

-- Has profile p blocked the current user? SECURITY DEFINER because the blocked person cannot read the row.
create or replace function private.blocked_me(p uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profile_blocks where blocker_id = p and blocked_id = (select auth.uid())
  );
$$;
revoke all on function private.blocked_me(uuid) from public;
grant execute on function private.blocked_me(uuid) to anon, authenticated;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select
  using ((select auth.uid()) is null or not private.blocked_me(id));

-- profile_phone (0011) reads profiles as the definer, so it checks blocks itself (both directions).
create or replace function public.profile_phone(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  result text;
begin
  if me is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if p_id <> me and exists (
    select 1 from public.profile_blocks
    where (blocker_id = p_id and blocked_id = me) or (blocker_id = me and blocked_id = p_id)
  ) then
    return null;
  end if;
  select phone into result from public.profiles where id = p_id;
  if result is null or p_id = me then
    return result;
  end if;
  if not exists (select 1 from public.phone_reads where reader_id = me and day = current_date and profile_id = p_id) then
    perform pg_advisory_xact_lock(hashtextextended('profile_phone:' || me::text, 0));
    if (select count(*) from public.phone_reads where reader_id = me and day = current_date) >= 50 then
      raise exception 'phone_daily_limit' using errcode = 'P0001';
    end if;
    insert into public.phone_reads (reader_id, profile_id) values (me, p_id) on conflict do nothing;
  end if;
  return result;
end;
$$;
revoke all on function public.profile_phone(uuid) from public, anon;
grant execute on function public.profile_phone(uuid) to authenticated;
