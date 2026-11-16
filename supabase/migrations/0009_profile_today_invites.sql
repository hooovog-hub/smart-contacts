-- 0009: profile photo, "Сейчас ищу", birthdays, daily picks, invites with bonus (founder decisions 2026-11-16).
-- Specs: docs/01-product/features/{profile,today,invites}.md. Security-reviewed before applying.
-- Re-runnable: policies/triggers are dropped before being created.

-- ---------- Profile photo (Storage) ----------
-- Every user file lives only under "<user_id>/" (security-privacy §6) — delete-account removes that folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatars own select" on storage.objects;
drop policy if exists "avatars own insert" on storage.objects;
drop policy if exists "avatars own update" on storage.objects;
drop policy if exists "avatars own delete" on storage.objects;
-- Select is needed for upsert/remove; it lists only the caller's own folder. Public URLs work without it.
create policy "avatars own select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- Birthdays (from the phone's contacts; owner-only via "contacts own" RLS) ----------
alter table public.contacts add column if not exists birthday date; -- year 1604 = unknown year (iOS convention)
create index if not exists contacts_birthday_md_idx
  on public.contacts (owner_id, extract(month from birthday), extract(day from birthday))
  where birthday is not null;

-- ---------- "Сейчас ищу" ----------
create table if not exists public.profile_seeks (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  text        text not null check (char_length(btrim(text)) between 2 and 80),
  source      text not null default 'manual' check (source in ('manual', 'ai')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists profile_seeks_profile_idx on public.profile_seeks (profile_id) where resolved_at is null;
alter table public.profile_seeks enable row level security;
drop policy if exists "seeks read" on public.profile_seeks;
drop policy if exists "seeks own insert" on public.profile_seeks;
drop policy if exists "seeks own update" on public.profile_seeks;
drop policy if exists "seeks own delete" on public.profile_seeks;
-- Same visibility as brands: public for Pro profiles, always for the owner.
create policy "seeks read" on public.profile_seeks for select
  using (private.is_paid(profile_id) or (select auth.uid()) = profile_id);
create policy "seeks own insert" on public.profile_seeks for insert to authenticated
  with check ((select auth.uid()) = profile_id);
create policy "seeks own update" on public.profile_seeks for update to authenticated
  using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "seeks own delete" on public.profile_seeks for delete to authenticated
  using ((select auth.uid()) = profile_id);
-- At most 5 open needs per profile — also when re-opening a resolved one. Serialised per profile.
create or replace function private.seeks_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.resolved_at is null and (tg_op = 'INSERT' or old.resolved_at is not null) then
    perform 1 from public.profiles where id = new.profile_id for update;
    if (select count(*) from public.profile_seeks s
         where s.profile_id = new.profile_id and s.resolved_at is null and s.id <> new.id) >= 5 then
      raise exception 'seeks_limit' using hint = 'At most 5 open needs';
    end if;
  end if;
  return new;
end $$;
revoke execute on function private.seeks_limit() from public, anon, authenticated;
drop trigger if exists profile_seeks_limit on public.profile_seeks;
create trigger profile_seeks_limit before insert or update of resolved_at on public.profile_seeks
  for each row execute function private.seeks_limit();

-- ---------- Daily picks ("Стоит написать сегодня"), written only by the daily-picks Edge Function ----------
create table if not exists public.daily_picks (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  position   smallint not null default 0,
  reason     text not null check (char_length(reason) <= 200),
  message    text not null check (char_length(message) <= 600),
  created_at timestamptz not null default now(),
  unique (owner_id, day, contact_id)
);
create index if not exists daily_picks_owner_day_idx on public.daily_picks (owner_id, day);
create index if not exists daily_picks_contact_idx on public.daily_picks (contact_id);
alter table public.daily_picks enable row level security;
drop policy if exists "daily picks own read" on public.daily_picks;
create policy "daily picks own read" on public.daily_picks for select to authenticated
  using ((select auth.uid()) = owner_id);
-- No insert/update/delete policies: only the service role writes. The contact must belong to the owner.
create or replace function private.daily_picks_owner_check() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.contacts c where c.id = new.contact_id and c.owner_id = new.owner_id) then
    raise exception 'daily_picks: contact does not belong to owner';
  end if;
  return new;
end $$;
revoke execute on function private.daily_picks_owner_check() from public, anon, authenticated;
drop trigger if exists daily_picks_owner_check on public.daily_picks;
create trigger daily_picks_owner_check before insert or update on public.daily_picks
  for each row execute function private.daily_picks_owner_check();

-- ---------- Invites: 10 friends with a filled profile = +1 month Pro ----------
-- invite_code is public (needed to resolve a link); who invited whom is private (profile_invites, owner-only).
alter table public.profiles add column if not exists invite_code text;
update public.profiles set invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) where invite_code is null;
create unique index if not exists profiles_invite_code_idx on public.profiles (invite_code);

create table if not exists public.profile_invites (
  profile_id uuid primary key references public.profiles (id) on delete cascade, -- the invitee
  invited_by uuid not null references public.profiles (id) on delete cascade,
  counted_at timestamptz,
  created_at timestamptz not null default now(),
  check (profile_id <> invited_by)
);
create index if not exists profile_invites_by_idx on public.profile_invites (invited_by);
alter table public.profile_invites enable row level security;
drop policy if exists "invites own read" on public.profile_invites;
drop policy if exists "invites own insert" on public.profile_invites;
-- The invitee sees their own row; the inviter sees only counts via my_invite_stats().
create policy "invites own read" on public.profile_invites for select to authenticated
  using ((select auth.uid()) = profile_id);
-- Set once, by the invitee, right after creating the profile. No update/delete for clients.
create policy "invites own insert" on public.profile_invites for insert to authenticated
  with check ((select auth.uid()) = profile_id and counted_at is null);

create table if not exists public.invite_rewards (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  milestone  int not null check (milestone > 0), -- 1 = first 10 friends, 2 = 20, …
  created_at timestamptz not null default now(),
  unique (profile_id, milestone)
);
create index if not exists invite_rewards_profile_idx on public.invite_rewards (profile_id);
alter table public.invite_rewards enable row level security;
drop policy if exists "invite rewards own read" on public.invite_rewards;
create policy "invite rewards own read" on public.invite_rewards for select to authenticated
  using ((select auth.uid()) = profile_id);

-- Extend the guard from 0008: clients cannot set invite_code, and avatar_url may only point to their own folder.
create or replace function public.profiles_guard_plan() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.avatar_url is not null
       and new.avatar_url is distinct from (case when tg_op = 'UPDATE' then old.avatar_url end)
       and new.avatar_url not like 'https://nqaooorpdptdsucgmwkg.supabase.co/storage/v1/object/public/avatars/' || new.id::text || '/%' then
      raise exception 'avatar_url must point to your own avatars folder';
    end if;
    if tg_op = 'INSERT' then
      new.plan := 'pro';
      new.pro_until := private.promo_until(new.id);
      new.is_demo := false;
      new.invite_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    else
      new.plan := old.plan;
      new.pro_until := old.pro_until;
      new.is_demo := old.is_demo;
      new.invite_code := old.invite_code;
    end if;
  end if;
  return new;
end $$;

-- "Filled profile" for invite counting: name, role, phone and (about or a brand).
create or replace function private.profile_filled(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles x
    where x.id = p
      and coalesce(btrim(x.full_name), '') <> ''
      and coalesce(btrim(x.role), '') <> ''
      and coalesce(btrim(x.phone), '') <> ''
      and (coalesce(btrim(x.bio), '') <> '' or exists (select 1 from public.brands b where b.profile_id = x.id))
  )
$$;
revoke execute on function private.profile_filled(uuid) from public, anon, authenticated;

-- Count the invitee once; every 10 counted invitees give the inviter +1 month of Pro (idempotent via invite_rewards).
-- Plan is never changed except free → pro; paid/permanent Pro (pro_until is null) only gets the reward recorded.
create or replace function private.count_invite(p uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_inviter uuid;
  v_counted int;
  v_plan    public.plan;
  v_until   timestamptz;
  m int;
begin
  select invited_by into v_inviter from public.profile_invites where profile_id = p and counted_at is null;
  if v_inviter is null or not private.profile_filled(p) then return; end if;

  perform 1 from public.profiles where id = v_inviter for update; -- serialise milestones per inviter
  update public.profile_invites set counted_at = now() where profile_id = p and counted_at is null;
  if not found then return; end if;

  select count(*) into v_counted from public.profile_invites where invited_by = v_inviter and counted_at is not null;
  for m in 1 .. (v_counted / 10) loop
    insert into public.invite_rewards (profile_id, milestone) values (v_inviter, m)
      on conflict (profile_id, milestone) do nothing;
    if found then
      select plan, pro_until into v_plan, v_until from public.profiles where id = v_inviter;
      if v_plan = 'free' then
        update public.profiles set plan = 'pro', pro_until = now() + interval '1 month' where id = v_inviter;
      elsif v_until is not null then
        update public.profiles set pro_until = greatest(v_until, now()) + interval '1 month' where id = v_inviter;
      end if;
    end if;
  end loop;
end $$;
revoke execute on function private.count_invite(uuid) from public, anon, authenticated;

create or replace function private.count_invite_trg() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'brands' then
    perform private.count_invite(new.profile_id);
  elsif tg_table_name = 'profile_invites' then
    perform private.count_invite(new.profile_id);
  else
    perform private.count_invite(new.id);
  end if;
  return null;
end $$;
revoke execute on function private.count_invite_trg() from public, anon, authenticated;

drop trigger if exists profiles_count_invite on public.profiles;
create trigger profiles_count_invite after update of full_name, role, phone, bio on public.profiles
  for each row execute function private.count_invite_trg();
drop trigger if exists brands_count_invite on public.brands;
create trigger brands_count_invite after insert on public.brands
  for each row execute function private.count_invite_trg();
drop trigger if exists profile_invites_count on public.profile_invites;
create trigger profile_invites_count after insert on public.profile_invites
  for each row execute function private.count_invite_trg();

-- Invite stats for the owner's screen: how many joined via their code and how many were counted.
create or replace function public.my_invite_stats() returns table (joined int, counted int, rewards int)
language sql stable security definer set search_path = '' as $$
  select
    (select count(*)::int from public.profile_invites where invited_by = (select auth.uid())),
    (select count(*)::int from public.profile_invites where invited_by = (select auth.uid()) and counted_at is not null),
    (select count(*)::int from public.invite_rewards where profile_id = (select auth.uid()))
$$;
revoke execute on function public.my_invite_stats() from public, anon;
grant execute on function public.my_invite_stats() to authenticated;
