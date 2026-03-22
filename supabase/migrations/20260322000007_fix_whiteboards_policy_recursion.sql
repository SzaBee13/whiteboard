-- Fix recursive RLS dependency between whiteboards and whiteboard_members.
-- Previous setup:
--   whiteboards SELECT -> checks whiteboard_members
--   whiteboard_members SELECT -> checks whiteboards
-- This creates infinite recursion when selecting whiteboards.

drop policy if exists "Members can view relevant invitations" on public.whiteboard_members;

create policy "Members can view relevant invitations"
  on public.whiteboard_members for select
  using (
    user_id = auth.uid()
    or invited_by = auth.uid()
  );
