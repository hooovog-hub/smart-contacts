-- 0012 (SC-103, step 2 of 2): the phone column can no longer be read directly by app users or anonymous
-- visitors, so nobody can download everyone's numbers with one request. Other columns stay readable
-- as before (RLS "profiles read" is unchanged). Phones go through profile_phone() (0011); the public
-- web page reads them on the server with the secret key.
-- Apply only after the app version that uses profile_phone() is out (OTA) and the web uses the secret key.

revoke select on public.profiles from anon, authenticated;
grant select (
  id, handle, full_name, role, bio, city, languages, links, helps, seeks, avatar_url, plan,
  created_at, updated_at, is_demo, pro_until, invite_code
) on public.profiles to anon, authenticated;
