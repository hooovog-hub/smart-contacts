-- Removes all demo data created by supabase/seed_demo.sql. Real users and their contacts are untouched.
begin;
delete from contacts where is_demo;
delete from rooms where id in (select room_id from room_members where profile_id in (select id from profiles where is_demo)) and owner_id in (select id from profiles where is_demo);
delete from rooms where code in ('SC1031','SC1022','SC1012','SC1114');
delete from auth.users where id in (select id from profiles where is_demo); -- cascades to profiles, brands, memberships, awards, endorsements
delete from categories where key = 'mantashyants' and not exists (select 1 from contacts c where c.category_key = 'mantashyants' and c.owner_id = categories.owner_id);
commit;
