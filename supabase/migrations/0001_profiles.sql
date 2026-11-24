-- ============================================================
-- Profiles: one row per user, with a unique username.
-- Username is auto-generated on first sign-in; users can change it.
-- Run this once in Supabase → SQL Editor.
-- ============================================================

-- Names users can't take (routes, brand, admin words)
create or replace function public.is_reserved_username(name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select name = any (array[
    'admin', 'administrator', 'api', 'app', 'auth', 'callback', 'codeharem',
    'dashboard', 'edit', 'help', 'login', 'logout', 'me', 'new', 'null',
    'products', 'projects', 'resources', 'root', 'settings', 'signin',
    'signup', 'support', 'system', 'undefined', 'user', 'users'
  ]);
$$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- 3–30 chars, lowercase letters, numbers, "-" or "_", starts and ends with a letter/number
  constraint username_format check (username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'),
  constraint username_not_reserved check (not public.is_reserved_username(username))
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Turn any seed (GitHub username, email prefix) into a free, valid username
create or replace function public.generate_username(seed text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  base      text;
  candidate text;
  n         int := 1;
begin
  base := lower(coalesce(seed, ''));
  base := regexp_replace(base, '[^a-z0-9_-]', '', 'g');   -- drop dots, spaces, symbols
  base := regexp_replace(base, '^[_-]+', '');             -- must start with letter/number
  base := left(base, 24);                                 -- leave room for a number suffix
  base := regexp_replace(base, '[_-]+$', '');             -- must end with letter/number
  if length(base) < 3 then
    base := 'dev' || base;
  end if;

  candidate := base;
  while public.is_reserved_username(candidate)
     or exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  return candidate;
end;
$$;

-- Create the profile when a user signs up (first Google/GitHub login)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  seed    text  := coalesce(meta ->> 'user_name', meta ->> 'preferred_username', split_part(new.email, '@', 1));
  attempt int   := 0;
begin
  loop
    begin
      insert into public.profiles (id, username, full_name, avatar_url)
      values (
        new.id,
        public.generate_username(seed),
        coalesce(meta ->> 'full_name', meta ->> 'name'),
        coalesce(meta ->> 'avatar_url', meta ->> 'picture')
      )
      on conflict (id) do nothing;
      return new;
    exception when unique_violation then
      -- Two people grabbed the same name at the same moment: try again
      attempt := attempt + 1;
      if attempt >= 3 then
        seed := seed || substr(md5(random()::text), 1, 4);
      end if;
      if attempt >= 8 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users who signed up before this migration
do $$
declare
  u record;
begin
  for u in
    select * from auth.users au
    where not exists (select 1 from public.profiles p where p.id = au.id)
  loop
    insert into public.profiles (id, username, full_name, avatar_url)
    values (
      u.id,
      public.generate_username(coalesce(
        u.raw_user_meta_data ->> 'user_name',
        u.raw_user_meta_data ->> 'preferred_username',
        split_part(u.email, '@', 1)
      )),
      coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
      coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
    );
  end loop;
end;
$$;

-- ============================================================
-- Security: signed-in users can read profiles; each user can
-- update only their own name, username and avatar.
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "Signed-in users can view profiles" on public.profiles;
create policy "Signed-in users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, full_name, avatar_url) on public.profiles to authenticated;
