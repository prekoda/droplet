-- Enable RLS
-- alter table auth.users enable row level security; -- (Often enabled by default, skipping to avoid permission errors)

-- 1. Profiles: EXTENDED for Signup Requirements
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  username text unique,
  university text default 'BPDC',
  year int,
  mobile text,
  email text, -- Useful for quick lookups
  last_post_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.profiles enable row level security;

do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can read all profiles') then
        create policy "Users can read all profiles" on public.profiles for select using (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile') then
        create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert own profile') then
        create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
    end if;
end $$;

-- 2. Posts
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  tag text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '30 days') not null,
  relate_count int default 0 not null check (relate_count >= 0),
  media_url text,
  media_type text -- 'image', 'video', 'gif'
);
alter table public.posts enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'posts' and policyname = 'Public posts are visible') then
        create policy "Public posts are visible" on public.posts for select using (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'posts' and policyname = 'Users can create posts') then
        create policy "Users can create posts" on public.posts for insert with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'posts' and policyname = 'Users can delete own posts') then
        create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);
    end if;
end $$;

-- 3. Replies
create table if not exists public.replies (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  parent_id uuid references public.replies(id) on delete cascade,
  is_deleted boolean default false,
  is_edited boolean default false,
  media_url text,
  media_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.replies enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'replies' and policyname = 'Replies are visible') then
        create policy "Replies are visible" on public.replies for select using (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'replies' and policyname = 'Users can reply') then
        create policy "Users can reply" on public.replies for insert with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'replies' and policyname = 'Users can update own replies') then
        create policy "Users can update own replies" on public.replies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'replies' and policyname = 'Users can delete own replies') then
        create policy "Users can delete own replies" on public.replies for delete using (auth.uid() = user_id);
    end if;
end $$;

-- 4. Interactions (Relates, Reports)
create table if not exists public.interactions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('relate', 'report', 'upvote', 'downvote')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id, type)
);
alter table public.interactions enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'interactions' and policyname = 'Users can create interactions') then
        create policy "Users can create interactions" on public.interactions for insert with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'interactions' and policyname = 'Public interactions are visible') then
        create policy "Public interactions are visible" on public.interactions for select using (true);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'interactions' and policyname = 'Users can delete own interactions') then
        create policy "Users can delete own interactions" on public.interactions for delete using (auth.uid() = user_id);
    end if;
end $$;

-- 5. Reports
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  reported_by uuid references public.profiles(id) not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'removed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  unique(post_id, reported_by)
);
alter table public.reports enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'Users can create reports') then
        create policy "Users can create reports" on public.reports for insert with check (auth.uid() = reported_by);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'Users can read own reports') then
        create policy "Users can read own reports" on public.reports for select using (auth.uid() = reported_by);
    end if;
end $$;

-- 6. Functions and Triggers
create or replace function update_post_relate_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT' and NEW.type = 'relate') then
    update public.posts set relate_count = relate_count + 1 where id = NEW.post_id;
  elsif (TG_OP = 'DELETE' and OLD.type = 'relate') then
    update public.posts set relate_count = relate_count - 1 where id = OLD.post_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_update_relate_count on public.interactions;
create trigger trigger_update_relate_count
  after insert or delete on public.interactions
  for each row
  execute function update_post_relate_count();

create or replace function check_email_exists(email_input text)
returns boolean
language plpgsql
security definer
as $$
declare
  exists_flag boolean;
begin
  select exists(select 1 from public.profiles where email = email_input) into exists_flag;
  return exists_flag;
end;
$$;

-- 7. Realtime Configuration
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'posts') then
    alter publication supabase_realtime add table posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'interactions') then
    alter publication supabase_realtime add table interactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'replies') then
    alter publication supabase_realtime add table replies;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'profiles') then
    alter publication supabase_realtime add table profiles;
  end if;
end $$;

alter table posts replica identity full;
alter table interactions replica identity full;
alter table replies replica identity full;

-- 8. Storage Buckets and Policies
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('post_media', 'post_media', true)
on conflict (id) do nothing;

-- Avatar Policies
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects for select using ( bucket_id = 'avatars' );
drop policy if exists "Users can upload avatars" on storage.objects;
create policy "Users can upload avatars" on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
drop policy if exists "Users can update avatars" on storage.objects;
create policy "Users can update avatars" on storage.objects for update using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Post Media Policies
drop policy if exists "Media is publicly accessible" on storage.objects;
create policy "Media is publicly accessible" on storage.objects for select using ( bucket_id = 'post_media' );
drop policy if exists "Users can upload media" on storage.objects;
create policy "Users can upload media" on storage.objects for insert with check ( bucket_id = 'post_media' and auth.role() = 'authenticated' );
drop policy if exists "Users can delete own media" on storage.objects;
create policy "Users can delete own media" on storage.objects for delete using ( bucket_id = 'post_media' and auth.uid() = owner );

-- 9. Final Fixes for Realtime (Ensuring SELECT is visible)
-- Note: Disabling RLS temporarily for these tables often helps debug "CLOSED" status
-- ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.interactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.replies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Proper SELECT Policies (if RLS is enabled)
DROP POLICY IF EXISTS "Posts are visible to everyone" ON public.posts;
CREATE POLICY "Posts are visible to everyone" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Interactions are visible to everyone" ON public.interactions;
CREATE POLICY "Interactions are visible to everyone" ON public.interactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Replies are visible to everyone" ON public.replies;
CREATE POLICY "Replies are visible to everyone" ON public.replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profiles are visible to everyone" ON public.profiles;
CREATE POLICY "Profiles are visible to everyone" ON public.profiles FOR SELECT USING (true);

-- Backfill counts
update public.posts p
set relate_count = (
    select count(*)
    from public.interactions i
    where i.post_id = p.id and i.type = 'relate'
);
