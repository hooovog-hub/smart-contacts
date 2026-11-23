-- 0010 (SC-105): crash reports are kept for 12 months at most, as the privacy policy promises.
-- A daily pg_cron job deletes older rows. The purge function is not callable through the API.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_old_client_errors()
returns integer
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.client_errors where created_at < now() - interval '12 months' returning 1
  )
  select count(*)::integer from gone;
$$;

revoke all on function public.purge_old_client_errors() from public, anon, authenticated;

-- Re-running the migration must not create a second job.
select cron.unschedule(jobid) from cron.job where jobname = 'purge-old-client-errors';
select cron.schedule('purge-old-client-errors', '17 3 * * *', $$select public.purge_old_client_errors()$$);
