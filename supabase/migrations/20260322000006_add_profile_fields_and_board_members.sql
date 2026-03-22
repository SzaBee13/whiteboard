-- Extend user profiles with username and bio
alter table public.user_profiles
  add column if not exists username text,
  add column if not exists bio text;

-- Backfill username for existing profiles with deterministic uniqueness
update public.user_profiles
set username = case
  when nullif(regexp_replace(lower(display_name), '[^a-z0-9_]', '', 'g'), '') is null then
    'user_' || substr(replace(id::text, '-', ''), 1, 24)
  else
    substr(regexp_replace(lower(display_name), '[^a-z0-9_]', '', 'g'), 1, 20) || '_' || substr(replace(id::text, '-', ''), 1, 8)
end
where username is null;

-- Keep usernames normalized and unique
alter table public.user_profiles
  alter column username set not null;

create unique index if not exists user_profiles_username_key
  on public.user_profiles (lower(username));

alter table public.user_profiles
  drop constraint if exists user_profiles_username_format,
  add constraint user_profiles_username_format
    check (username ~ '^[a-z0-9_]{3,30}$');

-- Ensure bios are never null for simpler client handling
update public.user_profiles
set bio = ''
where bio is null;

alter table public.user_profiles
  alter column bio set default '',
  alter column bio set not null;

alter table public.user_profiles
  drop constraint if exists user_profiles_bio_length,
  add constraint user_profiles_bio_length
    check (char_length(bio) <= 280);

-- Update signup trigger to initialize username and bio
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  candidate_username text;
begin
  base_username := regexp_replace(
    lower(
      coalesce(
        new.raw_user_meta_data->>'username',
        new.raw_user_meta_data->>'display_name',
        split_part(new.email, '@', 1)
      )
    ),
    '[^a-z0-9_]',
    '',
    'g'
  );

  if base_username is null or char_length(base_username) < 3 then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  candidate_username := substr(base_username, 1, 30);

  while exists (
    select 1
    from public.user_profiles
    where lower(username) = lower(candidate_username)
  ) loop
    candidate_username := substr(base_username, 1, 22) || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 7);
  end loop;

  insert into public.user_profiles (id, username, display_name, bio, avatar_color)
  values (
    new.id,
    candidate_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '',
    '#' || lpad(to_hex((random() * 16777215)::int), 6, '0')
  );

  return new;
end;
$$ language plpgsql security definer;

-- Members invited to private boards
create table if not exists public.whiteboard_members (
  id uuid primary key default gen_random_uuid(),
  whiteboard_id uuid not null references public.whiteboards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (whiteboard_id, user_id)
);

create index if not exists whiteboard_members_whiteboard_id_idx
  on public.whiteboard_members (whiteboard_id);

create index if not exists whiteboard_members_user_id_idx
  on public.whiteboard_members (user_id);

alter table public.whiteboard_members enable row level security;

-- Replace existing policies so access is: owner OR invited member OR authenticated public access
drop policy if exists "Users can view their own whiteboards" on public.whiteboards;
drop policy if exists "Users can create whiteboards" on public.whiteboards;
drop policy if exists "Users can update their own whiteboards" on public.whiteboards;
drop policy if exists "Users can delete their own whiteboards" on public.whiteboards;

create policy "Users can view accessible whiteboards"
  on public.whiteboards for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or is_public = true
      or exists (
        select 1
        from public.whiteboard_members m
        where m.whiteboard_id = whiteboards.id
          and m.user_id = auth.uid()
      )
    )
  );

create policy "Users can create whiteboards"
  on public.whiteboards for insert
  with check (auth.uid() = user_id);

create policy "Owners can update whiteboards"
  on public.whiteboards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners can delete whiteboards"
  on public.whiteboards for delete
  using (auth.uid() = user_id);

drop policy if exists "Anyone can view strokes on accessible whiteboards" on public.drawing_strokes;
drop policy if exists "Users can insert strokes in their whiteboards" on public.drawing_strokes;
drop policy if exists "Users can delete strokes in their whiteboards" on public.drawing_strokes;

create policy "Users can view strokes on accessible whiteboards"
  on public.drawing_strokes for select
  using (
    exists (
      select 1
      from public.whiteboards w
      where w.id = drawing_strokes.whiteboard_id
        and auth.uid() is not null
        and (
          w.user_id = auth.uid()
          or w.is_public = true
          or exists (
            select 1
            from public.whiteboard_members m
            where m.whiteboard_id = w.id
              and m.user_id = auth.uid()
          )
        )
    )
  );

create policy "Users can insert strokes on editable whiteboards"
  on public.drawing_strokes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.whiteboards w
      where w.id = drawing_strokes.whiteboard_id
        and (
          w.user_id = auth.uid()
          or w.is_public = true
          or exists (
            select 1
            from public.whiteboard_members m
            where m.whiteboard_id = w.id
              and m.user_id = auth.uid()
          )
        )
    )
  );

create policy "Users can delete own strokes and owners can moderate"
  on public.drawing_strokes for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.whiteboards w
      where w.id = drawing_strokes.whiteboard_id
        and w.user_id = auth.uid()
    )
  );

-- Policies for whiteboard_members
create policy "Members can view relevant invitations"
  on public.whiteboard_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.whiteboards w
      where w.id = whiteboard_members.whiteboard_id
        and w.user_id = auth.uid()
    )
  );

create policy "Owners can invite users"
  on public.whiteboard_members for insert
  with check (
    auth.uid() = invited_by
    and exists (
      select 1
      from public.whiteboards w
      where w.id = whiteboard_members.whiteboard_id
        and w.user_id = auth.uid()
    )
  );

create policy "Owners can remove invitations"
  on public.whiteboard_members for delete
  using (
    exists (
      select 1
      from public.whiteboards w
      where w.id = whiteboard_members.whiteboard_id
        and w.user_id = auth.uid()
    )
  );