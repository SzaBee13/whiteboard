-- Update drawing_strokes table to support new tool types and structure
-- Drop old columns
alter table public.drawing_strokes drop column if exists x;
alter table public.drawing_strokes drop column if exists y;

-- Add new columns
alter table public.drawing_strokes add column if not exists tool text not null default 'pen';
alter table public.drawing_strokes add column if not exists points jsonb not null default '[]'::jsonb;
alter table public.drawing_strokes add column if not exists filled boolean default false;

-- Add constraint to check valid tool types
alter table public.drawing_strokes add constraint valid_tool_type 
  check (tool in ('pen', 'line', 'rectangle', 'circle', 'eraser'));
