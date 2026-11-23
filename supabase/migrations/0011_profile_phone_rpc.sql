-- 0011 (SC-103, step 1 of 2): phone numbers are handed out one profile at a time.
-- profile_phone(id) returns your own phone always, and someone else's phone counting towards
-- a daily limit of 50 different people per signed-in user (re-opening the same person is free).
-- Step 2 (0012) closes the phone column for direct reads once the app uses this function.

create table if not exists public.phone_reads (
  reader_id  uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day        date not null default current_date,
  primary key (reader_id, day, profile_id)
);
create index if not exists phone_reads_profile_idx on public.phone_reads (profile_id);
-- Nobody reads or writes this table through the API; only profile_phone() does.
alter table public.phone_reads enable row level security;
revoke all on public.phone_reads from anon, authenticated;

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
  select phone into result from public.profiles where id = p_id;
  if result is null or p_id = me then
    return result;
  end if;
  if not exists (select 1 from public.phone_reads where reader_id = me and day = current_date and profile_id = p_id) then
    -- Serialise concurrent calls of one reader so parallel requests cannot overshoot the limit.
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

-- Public vCard (web, /<handle>/vcard) gives the phone without sign-in, so it is limited per visitor:
-- at most 20 downloads per hour from one IP. The web server stores only a hash of the IP.
create table if not exists public.web_rate_hits (
  key    text not null check (char_length(key) <= 200),
  bucket timestamptz not null,
  hits   integer not null default 0,
  primary key (key, bucket)
);
alter table public.web_rate_hits enable row level security;
revoke all on public.web_rate_hits from anon, authenticated;

-- true = allowed. Called only by the web server with the secret key (service_role).
create or replace function public.web_rate_hit(p_key text, p_limit integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  insert into public.web_rate_hits as w (key, bucket, hits)
  values (p_key, date_trunc('hour', now()), 1)
  on conflict (key, bucket) do update set hits = w.hits + 1
  returning hits <= p_limit;
$$;
revoke all on function public.web_rate_hit(text, integer) from public, anon, authenticated;
grant execute on function public.web_rate_hit(text, integer) to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'purge-old-web-rate-hits';
select cron.schedule('purge-old-web-rate-hits', '37 * * * *', $$delete from public.web_rate_hits where bucket < now() - interval '2 hours'$$);

-- Old counters are useless after a day; keep a week for debugging. Runs with the 0010 cron setup.
select cron.unschedule(jobid) from cron.job where jobname = 'purge-old-phone-reads';
select cron.schedule('purge-old-phone-reads', '27 3 * * *', $$delete from public.phone_reads where day < current_date - 7$$);
