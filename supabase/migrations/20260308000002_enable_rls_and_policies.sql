-- Enable Row Level Security
alter table public.whiteboards enable row level security;
alter table public.drawing_strokes enable row level security;

-- RLS Policies for whiteboards
create policy "Users can view their own whiteboards"
  on public.whiteboards for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can create whiteboards"
  on public.whiteboards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own whiteboards"
  on public.whiteboards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own whiteboards"
  on public.whiteboards for delete
  using (auth.uid() = user_id);

-- RLS Policies for drawing_strokes
create policy "Anyone can view strokes on accessible whiteboards"
  on public.drawing_strokes for select
  using (
    exists (
      select 1 from public.whiteboards
      where whiteboards.id = drawing_strokes.whiteboard_id
      and (whiteboards.user_id = auth.uid() or whiteboards.is_public = true)
    )
  );

create policy "Users can insert strokes in their whiteboards"
  on public.drawing_strokes for insert
  with check (
    exists (
      select 1 from public.whiteboards
      where whiteboards.id = drawing_strokes.whiteboard_id
      and whiteboards.user_id = auth.uid()
    )
  );

create policy "Users can delete strokes in their whiteboards"
  on public.drawing_strokes for delete
  using (
    exists (
      select 1 from public.whiteboards
      where whiteboards.id = drawing_strokes.whiteboard_id
      and whiteboards.user_id = auth.uid()
    )
  );
