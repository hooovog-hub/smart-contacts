-- 0005: fixes from Supabase advisors (performance). No change in who can see what.
--  * 0001 unindexed_foreign_keys      → index every foreign key
--  * 0003 auth_rls_initplan           → (select auth.uid()) is evaluated once per query, not per row
--  * 0006 multiple_permissive_policies → one SELECT policy per table; "own" ALL split into insert/update/delete

-- ── Indexes on foreign keys ──────────────────────────────────────────────
create index if not exists ai_messages_task_created_idx on public.ai_messages (task_id, created_at);
create index if not exists ai_tasks_owner_created_idx   on public.ai_tasks (owner_id, created_at desc);
create index if not exists ai_tasks_helper_contact_idx  on public.ai_tasks (helper_contact_id);
create index if not exists awards_profile_idx           on public.awards (profile_id);
create index if not exists brands_profile_idx           on public.brands (profile_id);
create index if not exists contacts_linked_profile_idx  on public.contacts (linked_profile_id);
create index if not exists endorsements_to_profile_idx  on public.endorsements (to_profile);
create index if not exists meeting_marks_member_idx     on public.meeting_marks (member_id);
create index if not exists memberships_org_idx          on public.memberships (organization_id);
create index if not exists memberships_profile_idx      on public.memberships (profile_id);
create index if not exists room_members_profile_idx     on public.room_members (profile_id);
create index if not exists room_members_room_idx        on public.room_members (room_id);
create index if not exists rooms_owner_idx              on public.rooms (owner_id);
create index if not exists team_members_profile_idx     on public.team_members (profile_id);
create index if not exists teams_owner_idx              on public.teams (owner_id);

-- ── profiles: public read, owner writes ──────────────────────────────────
drop policy if exists "profiles own write" on public.profiles;
create policy "profiles own insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles own update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles own delete" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

-- ── brands / awards: paid profiles are public, owner always sees and writes ─
drop policy if exists "brands read" on public.brands;
drop policy if exists "brands own"  on public.brands;
create policy "brands read"       on public.brands for select using (private.is_paid(profile_id) or (select auth.uid()) = profile_id);
create policy "brands own insert" on public.brands for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "brands own update" on public.brands for update to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "brands own delete" on public.brands for delete to authenticated using ((select auth.uid()) = profile_id);

drop policy if exists "awards read" on public.awards;
drop policy if exists "awards own"  on public.awards;
create policy "awards read"       on public.awards for select using (private.is_paid(profile_id) or (select auth.uid()) = profile_id);
create policy "awards own insert" on public.awards for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "awards own update" on public.awards for update to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "awards own delete" on public.awards for delete to authenticated using ((select auth.uid()) = profile_id);

-- ── memberships: owner cannot self-verify ────────────────────────────────
drop policy if exists "memberships read"    on public.memberships;
drop policy if exists "memberships own"     on public.memberships;
drop policy if exists "memberships own upd" on public.memberships;
drop policy if exists "memberships own del" on public.memberships;
create policy "memberships read"    on public.memberships for select using (private.is_paid(profile_id) or (select auth.uid()) = profile_id);
create policy "memberships own"     on public.memberships for insert to authenticated with check ((select auth.uid()) = profile_id and verified = false);
create policy "memberships own upd" on public.memberships for update to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id and verified = false);
create policy "memberships own del" on public.memberships for delete to authenticated using ((select auth.uid()) = profile_id);

-- ── endorsements: public read, author writes, not to self ────────────────
drop policy if exists "endorse write" on public.endorsements;
create policy "endorse insert" on public.endorsements for insert to authenticated with check ((select auth.uid()) = from_profile and from_profile <> to_profile);
create policy "endorse update" on public.endorsements for update to authenticated using ((select auth.uid()) = from_profile) with check ((select auth.uid()) = from_profile and from_profile <> to_profile);
create policy "endorse delete" on public.endorsements for delete to authenticated using ((select auth.uid()) = from_profile);

-- ── owner-only tables (contacts are sensitive: docs/03-architecture/security-privacy.md) ─
drop policy if exists "categories own" on public.categories;
create policy "categories own" on public.categories for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "contacts own" on public.contacts;
create policy "contacts own" on public.contacts for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "marks own" on public.meeting_marks;
create policy "marks own" on public.meeting_marks for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "tasks own" on public.ai_tasks;
create policy "tasks own" on public.ai_tasks for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "messages own" on public.ai_messages;
create policy "messages own" on public.ai_messages for all to authenticated
  using (exists (select 1 from public.ai_tasks t where t.id = task_id and t.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.ai_tasks t where t.id = task_id and t.owner_id = (select auth.uid())));

-- ── rooms: members and owner read, owner writes ──────────────────────────
drop policy if exists "rooms read" on public.rooms;
drop policy if exists "rooms own"  on public.rooms;
create policy "rooms read"       on public.rooms for select using (private.is_room_member(id) or (select auth.uid()) = owner_id);
create policy "rooms own insert" on public.rooms for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "rooms own update" on public.rooms for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "rooms own delete" on public.rooms for delete to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "members join self" on public.room_members;
create policy "members join self" on public.room_members for insert to authenticated with check ((select auth.uid()) = profile_id);

-- ── teams: members and owner read, owner writes ──────────────────────────
drop policy if exists "teams read" on public.teams;
drop policy if exists "teams own"  on public.teams;
create policy "teams read"       on public.teams for select using (private.is_team_member(id) or (select auth.uid()) = owner_id);
create policy "teams own insert" on public.teams for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "teams own update" on public.teams for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "teams own delete" on public.teams for delete to authenticated using ((select auth.uid()) = owner_id);
