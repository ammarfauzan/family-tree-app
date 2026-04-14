-- ============================================================
-- Family Tree App — Phase 3 SQL Migration
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage if needed)
-- ============================================================
-- CREATE BUCKET: 'profile-photos' (public)
-- CREATE BUCKET: 'person-gallery' (public)

-- Storage RLS: profile-photos
create policy "Authenticated can upload profile photos" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos' and auth.uid() is not null
  );
create policy "Anyone can view profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');
create policy "Uploader can delete profile photos" on storage.objects
  for delete using (
    bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: person-gallery
create policy "Authenticated can upload gallery photos" on storage.objects
  for insert with check (
    bucket_id = 'person-gallery' and auth.uid() is not null
  );
create policy "Anyone can view gallery photos" on storage.objects
  for select using (bucket_id = 'person-gallery');
create policy "Uploader can delete gallery photos" on storage.objects
  for delete using (
    bucket_id = 'person-gallery' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- NOTIFICATION HELPERS
-- ============================================================

-- RPC: create a notification (called server-side via security definer)
create or replace function public.create_notification(
  p_user_id  uuid,
  p_type     text,
  p_payload  jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, type, payload)
  values (p_user_id, p_type, p_payload);
end;
$$;

-- RPC: mark all notifications read for the current user
create or replace function public.mark_notifications_read()
returns void
language sql security definer as $$
  update public.notifications
  set is_read = true
  where user_id = auth.uid() and is_read = false;
$$;

-- RPC: get unread notification count for current user
create or replace function public.unread_notification_count()
returns int
language sql security definer as $$
  select count(*)::int from public.notifications
  where user_id = auth.uid() and is_read = false;
$$;

-- Trigger: NOTIF-01 — notify person's linked user when their profile is updated by someone else
create or replace function public.notify_profile_updated()
returns trigger language plpgsql security definer as $$
declare
  v_linked_user uuid;
begin
  -- Only if updated_by differs from linked_user_id (someone else edited)
  if new.linked_user_id is not null and new.updated_by != new.linked_user_id then
    perform public.create_notification(
      new.linked_user_id,
      'profile_updated',
      jsonb_build_object(
        'person_id', new.id,
        'person_name', new.full_name,
        'updated_by', new.updated_by,
        'tree_id', new.tree_id
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_person_updated on public.persons;
create trigger on_person_updated
  after update on public.persons
  for each row
  when (old.updated_at is distinct from new.updated_at)
  execute procedure public.notify_profile_updated();

-- Trigger: NOTIF-02 — notify user when added to a new tree
create or replace function public.notify_tree_joined()
returns trigger language plpgsql security definer as $$
begin
  -- Don't notify the person who created the membership (owner self-join)
  if new.invited_by is not null and new.user_id != new.invited_by then
    perform public.create_notification(
      new.user_id,
      'tree_invite',
      jsonb_build_object(
        'tree_id', new.tree_id,
        'role', new.role,
        'invited_by', new.invited_by
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_tree_member_added on public.tree_members;
create trigger on_tree_member_added
  after insert on public.tree_members
  for each row
  execute procedure public.notify_tree_joined();
