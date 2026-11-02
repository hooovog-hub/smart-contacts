-- 0001_init: базовая схема Smart Contacts
-- Документация: docs/03-architecture/data-model.md

create extension if not exists "pgcrypto";

create type plan as enum ('free','pro','business');
create type contact_source as enum ('phonebook','qr','room','manual');
create type award_kind as enum ('medal','cert','press','talk','case');
create type task_category as enum ('biz','personal','friends','family','med','home');
create type task_status as enum ('open','done');

-- ---------- Профили ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_.]{3,30}$'),
  full_name text not null,
  role text,
  bio text,
  city text,
  languages text[] default '{}',
  phone text,
  links jsonb not null default '{}'::jsonb,       -- {whatsapp, telegram, instagram, linkedin, site, email}
  helps text[] default '{}',
  seeks text[] default '{}',
  avatar_url text,
  plan plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  sphere text,
  description text,
  founded_year int,
  team_size text,
  offer text,
  links jsonb not null default '{}'::jsonb,       -- {instagram, site, facebook, linkedin, youtube, tiktok}
  logo_url text,
  position int not null default 0
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text,                                       -- club | chamber | association
  verified boolean not null default false
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  org_name text not null,
  status_title text default 'Член',
  since_year int,
  verified boolean not null default false          -- ставит только организация / сервис
);

create table awards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  kind award_kind not null default 'medal',
  year int,
  source text
);

create table endorsements (
  id uuid primary key default gen_random_uuid(),
  from_profile uuid not null references profiles(id) on delete cascade,
  to_profile uuid not null references profiles(id) on delete cascade,
  text text not null check (length(text) between 3 and 500),
  created_at timestamptz not null default now(),
  unique (from_profile, to_profile)
);

-- ---------- Книжка ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  key text not null,
  name text not null,
  icon text,
  color text,
  position int not null default 0,
  is_system boolean not null default false,
  unique (owner_id, key)
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  linked_profile_id uuid references profiles(id) on delete set null,
  display_name text not null,
  phone text,
  role text,
  category_key text not null default 'unsorted',
  note text,
  source contact_source not null default 'manual',
  met_room_id uuid,
  met_at timestamptz,
  is_temporary boolean not null default false,
  expires_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index contacts_owner_idx on contacts(owner_id, category_key);

-- ---------- Встречи ----------
create table rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  kind text,
  place text,
  starts_at timestamptz,
  code text unique not null default upper(substr(md5(random()::text),1,6))
);

create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  guest_name text,
  guest_role text,
  guest_phone text,
  joined_at timestamptz not null default now(),
  check (profile_id is not null or guest_name is not null)
);

create table meeting_marks (
  owner_id uuid not null references profiles(id) on delete cascade,
  member_id uuid not null references room_members(id) on delete cascade,
  talked boolean not null,
  primary key (owner_id, member_id)
);

-- ---------- AI ----------
create table ai_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  category task_category not null default 'biz',
  status task_status not null default 'open',
  helper_contact_id uuid references contacts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references ai_tasks(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  people jsonb not null default '[]'::jsonb,       -- [{contactId, kind, why, ask}]
  created_at timestamptz not null default now()
);

-- ---------- Business ----------
create table teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  seats int not null default 5
);
create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  primary key (team_id, profile_id)
);

-- ================= RLS =================
alter table profiles enable row level security;
alter table brands enable row level security;
alter table organizations enable row level security;
alter table memberships enable row level security;
alter table awards enable row level security;
alter table endorsements enable row level security;
alter table categories enable row level security;
alter table contacts enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table meeting_marks enable row level security;
alter table ai_tasks enable row level security;
alter table ai_messages enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;

-- Публичное: профиль виден всем; Pro-блоки — только если владелец не на free
create policy "profiles read" on profiles for select using (true);
create policy "profiles own write" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create function is_paid(p uuid) returns boolean language sql stable set search_path = public as
$$ select exists (select 1 from profiles where id = p and plan <> 'free') $$;

create policy "brands read" on brands for select using (is_paid(profile_id) or auth.uid() = profile_id);
create policy "brands own" on brands for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "memberships read" on memberships for select using (is_paid(profile_id) or auth.uid() = profile_id);
create policy "memberships own" on memberships for insert with check (auth.uid() = profile_id and verified = false);
create policy "memberships own upd" on memberships for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id and verified = false);
create policy "memberships own del" on memberships for delete using (auth.uid() = profile_id);
create policy "awards read" on awards for select using (is_paid(profile_id) or auth.uid() = profile_id);
create policy "awards own" on awards for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "orgs read" on organizations for select using (true);
create policy "endorse read" on endorsements for select using (true);
create policy "endorse write" on endorsements for all using (auth.uid() = from_profile) with check (auth.uid() = from_profile and from_profile <> to_profile);

-- Частное: только владелец
create policy "categories own" on categories for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "contacts own" on contacts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "marks own" on meeting_marks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "tasks own" on ai_tasks for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "messages own" on ai_messages for all
  using (exists (select 1 from ai_tasks t where t.id = task_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from ai_tasks t where t.id = task_id and t.owner_id = auth.uid()));

-- Комнаты: видят владелец и участники; вход гостей — через сервер (service role)
create function is_room_member(r uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from room_members where room_id = r and profile_id = auth.uid())
       or exists (select 1 from rooms where id = r and owner_id = auth.uid()) $$;
create policy "rooms read" on rooms for select using (is_room_member(id));
create policy "rooms own" on rooms for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "members read" on room_members for select using (is_room_member(room_id));
create policy "members join self" on room_members for insert with check (auth.uid() = profile_id);

-- Команды
-- security definer, чтобы политики teams и team_members не вызывали друг друга рекурсивно
create function is_team_member(t uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from teams where id = t and owner_id = auth.uid())
       or exists (select 1 from team_members where team_id = t and profile_id = auth.uid()) $$;
create policy "teams read" on teams for select using (is_team_member(id));
create policy "teams own" on teams for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "team members read" on team_members for select using (is_team_member(team_id));

-- Системные разделы при регистрации
create function seed_categories() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into categories(owner_id,key,name,icon,color,position,is_system) values
   (new.id,'family','Семья','home-heart','a4',0,true),
   (new.id,'work','Работа','briefcase','a1',1,true),
   (new.id,'friends','Друзья','users','a5',2,true),
   (new.id,'repair','Ремонт','wrench','a2',3,true),
   (new.id,'med','Медицина','heart-pulse','a3',4,true),
   (new.id,'finance','Финансы и право','coins','a6',5,true),
   (new.id,'travel','Путешествия','plane','a5',6,true),
   (new.id,'home','Дом и быт','house','a4',7,true),
   (new.id,'auto','Авто','car','a2',8,true),
   (new.id,'food','Рестораны','utensils','a6',9,true),
   (new.id,'edu','Образование','graduation-cap','a1',10,true),
   (new.id,'beauty','Красота','sparkles','a3',11,true);
  return new;
end $$;
create trigger profiles_seed_categories after insert on profiles for each row execute function seed_categories();
