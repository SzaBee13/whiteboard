-- Create whiteboards table
create table public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_public boolean default false
);

-- Create drawing_strokes table
create table public.drawing_strokes (
  id uuid primary key default gen_random_uuid(),
  whiteboard_id uuid not null references public.whiteboards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  x float not null,
  y float not null,
  color text not null,
  size int not null,
  timestamp bigint not null
);

-- Create indexes for better query performance
create index whiteboards_user_id_idx on public.whiteboards(user_id);
create index drawing_strokes_whiteboard_id_idx on public.drawing_strokes(whiteboard_id);
create index drawing_strokes_timestamp_idx on public.drawing_strokes(timestamp);
