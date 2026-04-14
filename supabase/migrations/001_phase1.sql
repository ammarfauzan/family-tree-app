-- ============================================================
-- Family Tree App — Phase 1 SQL Migration
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Family Trees
create table if not exists public.family_trees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  cover_photo text,
  privacy     text not null default 'family_only'
                check (privacy in ('public', 'family_only', 'private')),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. Tree Members (junction)
create table if not exists public.tree_members (
  id          uuid primary key default gen_random_uuid(),
  tree_id     uuid not null references public.family_trees(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member'
                check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by  uuid references auth.users(id),
  joined_at   timestamptz default now(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (tree_id, user_id)
);

-- 4. Persons
create table if not exists public.persons (
  id               uuid primary key default gen_random_uuid(),
  tree_id          uuid not null references public.family_trees(id) on delete cascade,
  linked_user_id   uuid references auth.users(id),
  full_name        text not null,
  nickname         text,
  gender           text default 'unknown'
                     check (gender in ('male', 'female', 'other', 'unknown')),
  birth_date       date,
  birth_place      text,
  death_date       date,
  is_deceased      boolean default false,
  profile_photo    text,
  address          text,
  phone            text,
  email            text,
  occupation       text,
  education        text,
  biography        text,
  religion         text,
  nationality      text,
  social_links     jsonb,
  interests        text[],
  custom_notes     text,
  created_by       uuid references auth.users(id),
  updated_by       uuid references auth.users(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 5. Relationships
create table if not exists public.relationships (
  id             uuid primary key default gen_random_uuid(),
  tree_id        uuid not null references public.family_trees(id) on delete cascade,
  person_a_id    uuid not null references public.persons(id) on delete cascade,
  person_b_id    uuid not null references public.persons(id) on delete cascade,
  relation_type  text not null
                   check (relation_type in ('parent', 'child', 'spouse', 'sibling')),
  relation_note  text,
  start_date     date,
  end_date       date,
  created_by     uuid references auth.users(id),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- 6. Person Gallery
create table if not exists public.person_gallery (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.persons(id) on delete cascade,
  photo_url    text not null,
  caption      text,
  uploaded_by  uuid references auth.users(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 7. Deletion Requests
create table if not exists public.deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  tree_id       uuid not null references public.family_trees(id) on delete cascade,
  person_id     uuid not null references public.persons(id) on delete cascade,
  requested_by  uuid not null references auth.users(id),
  reason        text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  reviewed_by   uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 8. Notifications
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  payload    jsonb,
  is_read    boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.family_trees      enable row level security;
alter table public.tree_members      enable row level security;
alter table public.persons           enable row level security;
alter table public.relationships     enable row level security;
alter table public.person_gallery    enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.notifications     enable row level security;

-- Helper: is the current user a member of a tree?
create or replace function public.is_tree_member(p_tree_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.tree_members
    where tree_id = p_tree_id and user_id = auth.uid()
  );
$$;

-- Helper: get user's role in a tree
create or replace function public.tree_role(p_tree_id uuid)
returns text language sql security definer as $$
  select role from public.tree_members
  where tree_id = p_tree_id and user_id = auth.uid()
  limit 1;
$$;

-- profiles
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- family_trees
create policy "Members can view their trees" on public.family_trees
  for select using (public.is_tree_member(id));
create policy "Authenticated users can create trees" on public.family_trees
  for insert with check (auth.uid() = owner_id);
create policy "Owners can update their trees" on public.family_trees
  for update using (owner_id = auth.uid());
create policy "Owners can delete their trees" on public.family_trees
  for delete using (owner_id = auth.uid());

-- tree_members
create policy "Members can view tree_members" on public.tree_members
  for select using (public.is_tree_member(tree_id));
create policy "System/owner can insert tree_members" on public.tree_members
  for insert with check (
    user_id = auth.uid() or
    public.tree_role(tree_id) in ('owner', 'admin')
  );
create policy "Owners/admins can delete tree_members" on public.tree_members
  for delete using (public.tree_role(tree_id) in ('owner', 'admin'));

-- persons
create policy "Tree members can view persons" on public.persons
  for select using (public.is_tree_member(tree_id));
create policy "Tree members (non-viewer) can insert persons" on public.persons
  for insert with check (
    public.tree_role(tree_id) in ('owner', 'admin', 'member')
  );
create policy "Members can update persons they created or are admins" on public.persons
  for update using (
    public.tree_role(tree_id) in ('owner', 'admin') or
    created_by = auth.uid()
  );
create policy "Owners/admins can delete persons" on public.persons
  for delete using (public.tree_role(tree_id) in ('owner', 'admin'));

-- relationships
create policy "Tree members can view relationships" on public.relationships
  for select using (public.is_tree_member(tree_id));
create policy "Non-viewers can manage relationships" on public.relationships
  for all using (public.tree_role(tree_id) in ('owner', 'admin', 'member'));

-- person_gallery
create policy "Tree members can view gallery" on public.person_gallery
  for select using (
    exists (select 1 from public.persons p where p.id = person_id and public.is_tree_member(p.tree_id))
  );
create policy "Uploaders can insert gallery" on public.person_gallery
  for insert with check (uploaded_by = auth.uid());
create policy "Uploaders/admins can delete gallery" on public.person_gallery
  for delete using (uploaded_by = auth.uid());

-- deletion_requests
create policy "Requesters can create deletion requests" on public.deletion_requests
  for insert with check (requested_by = auth.uid());
create policy "Requesters/admins can view deletion requests" on public.deletion_requests
  for select using (
    requested_by = auth.uid() or
    public.tree_role(tree_id) in ('owner', 'admin')
  );
create policy "Admins can update deletion requests" on public.deletion_requests
  for update using (public.tree_role(tree_id) in ('owner', 'admin'));

-- notifications
create policy "Users see own notifications" on public.notifications
  for all using (user_id = auth.uid());

-- ============================================================
-- PHASE 1 GAP FIXES (run after the main migration)
-- ============================================================

-- RPC: find a registered user by email (used in AddMember to link persons to accounts)
-- Security definer allows reading auth.users email safely from client SDK.
create or replace function public.find_user_by_email(p_email text)
returns table (id uuid, full_name text)
language sql security definer as $$
  select u.id, p.full_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(p_email)
  limit 1;
$$;

-- Storage bucket for tree cover photos
-- Run this manually in Supabase Dashboard → Storage → New Bucket, OR via:
-- insert into storage.buckets (id, name, public) values ('tree-covers', 'tree-covers', true);
-- RLS: only tree owners can upload; anyone authenticated can read (public bucket)
create policy "Authenticated users can upload tree covers" on storage.objects
  for insert with check (
    bucket_id = 'tree-covers' and auth.uid() is not null
  );
create policy "Anyone can view tree covers" on storage.objects
  for select using (bucket_id = 'tree-covers');
