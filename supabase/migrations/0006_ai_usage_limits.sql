-- 0006: AI usage limits and rate limiting (protects the Claude bill and the free plan quota).
-- Every AI call is logged in ai_usage. Edge Functions call private-by-grant public.ai_consume()
-- with the service role key; the mobile client cannot call it or write ai_usage directly.

create table if not exists public.ai_usage (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  fn         text not null check (char_length(fn) between 1 and 40),
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_owner_fn_created_idx on public.ai_usage (owner_id, fn, created_at desc);

alter table public.ai_usage enable row level security;
-- The owner may read their own usage (e.g. "3 of 5 tasks used"); nobody writes through the API.
create policy "ai_usage own read" on public.ai_usage for select to authenticated using ((select auth.uid()) = owner_id);

-- Atomically check limits and record one use.
-- Returns {"ok":true} or {"ok":false,"reason":"rate_minute|rate_day|quota_month","retry_after":seconds}.
-- NULL limit = no limit for that window.
create or replace function public.ai_consume(
  p_user uuid,
  p_fn text,
  p_per_minute int default null,
  p_per_day int default null,
  p_per_month int default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
  month_start timestamptz := date_trunc('month', now());
begin
  if p_user is null then
    return jsonb_build_object('ok', false, 'reason', 'no_user', 'retry_after', 0);
  end if;
  -- Serialise concurrent calls of the same user+function so limits cannot be overrun by parallel requests.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_fn, 0));

  if p_per_minute is not null then
    select count(*) into n from public.ai_usage
      where owner_id = p_user and fn = p_fn and created_at > now() - interval '1 minute';
    if n >= p_per_minute then
      return jsonb_build_object('ok', false, 'reason', 'rate_minute', 'retry_after', 60);
    end if;
  end if;

  if p_per_day is not null then
    select count(*) into n from public.ai_usage
      where owner_id = p_user and fn = p_fn and created_at > now() - interval '1 day';
    if n >= p_per_day then
      return jsonb_build_object('ok', false, 'reason', 'rate_day', 'retry_after', 3600);
    end if;
  end if;

  if p_per_month is not null then
    select count(*) into n from public.ai_usage
      where owner_id = p_user and fn = p_fn and created_at >= month_start;
    if n >= p_per_month then
      return jsonb_build_object('ok', false, 'reason', 'quota_month',
        'retry_after', ceil(extract(epoch from (month_start + interval '1 month' - now())))::int);
    end if;
  end if;

  insert into public.ai_usage (owner_id, fn) values (p_user, p_fn);
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.ai_consume(uuid, text, int, int, int) from public, anon, authenticated;
grant execute on function public.ai_consume(uuid, text, int, int, int) to service_role;
