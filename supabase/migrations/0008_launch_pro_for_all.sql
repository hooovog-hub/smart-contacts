-- 0008: launch promo — every account gets Pro free for 2 months from sign-up (founder decision 2026-11-16).
-- Also closes holes found in security review:
--  * clients could set their own `plan` and `is_demo` (RLS "profiles own update" allowed any column);
--    is_demo = true would make supabase/remove_demo.sql delete a real account;
--  * clients could delete + re-insert their profile (policy "profiles own delete") to restart the promo.
-- Only the server (service role / SQL editor) may change plan, pro_until and is_demo.
-- Downgrade after pro_until is enforced later, together with In-App Purchase (SC-060).

alter table public.profiles add column if not exists pro_until timestamptz;
comment on column public.profiles.pro_until is
  'Pro is free until this moment (launch promo). NULL = no promo. Enforced with IAP (SC-060).';

alter table public.profiles alter column plan set default 'pro';

-- Existing accounts: Free → Pro for 2 months from their own registration (all registered after 2026-11-01).
update public.profiles
   set plan = 'pro', pro_until = created_at + interval '2 months'
 where plan = 'free';

-- Promo end is tied to the auth user's sign-up time, so re-creating the profile does not restart it.
create or replace function private.promo_until(uid uuid) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select coalesce((select u.created_at from auth.users u where u.id = uid), now()) + interval '2 months'
$$;
-- Called by the invoker trigger below as `authenticated`; the private schema is not exposed via the Data API.
revoke execute on function private.promo_until(uuid) from public, anon;
grant execute on function private.promo_until(uuid) to authenticated;

-- Clients cannot choose or change plan / promo / demo flag. New profiles always start with the promo.
create or replace function public.profiles_guard_plan() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.plan := 'pro';
      new.pro_until := private.promo_until(new.id);
      new.is_demo := false;
    else
      new.plan := old.plan;
      new.pro_until := old.pro_until;
      new.is_demo := old.is_demo;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.profiles_guard_plan() from public, anon, authenticated;

drop trigger if exists profiles_guard_plan on public.profiles;
create trigger profiles_guard_plan before insert or update on public.profiles
  for each row execute function public.profiles_guard_plan();

-- Account deletion goes only through the delete-account Edge Function (service role); clients never delete profiles.
drop policy if exists "profiles own delete" on public.profiles;
