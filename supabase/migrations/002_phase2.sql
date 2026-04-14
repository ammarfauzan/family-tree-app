-- ============================================================
-- Family Tree App — Phase 2 SQL Migration
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- Invitations table
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  tree_id     uuid not null references public.family_trees(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by  uuid not null references auth.users(id),
  email       text,                      -- optional: intended recipient email
  person_id   uuid references public.persons(id), -- pre-created person record to link on join
  role        text not null default 'member'
                check (role in ('admin', 'member', 'viewer')),
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'expired')),
  expires_at  timestamptz default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.invitations enable row level security;

-- Owner/Admin can create invitations for their trees
create policy "Owners/admins can create invitations" on public.invitations
  for insert with check (
    public.tree_role(tree_id) in ('owner', 'admin')
  );

-- Owner/Admin can view invitations for their trees
create policy "Owners/admins can view invitations" on public.invitations
  for select using (
    public.tree_role(tree_id) in ('owner', 'admin')
  );

-- Anyone can read a single invitation by token (for join flow — no auth required)
-- We expose this via a public RPC instead of a direct policy to avoid leaking all rows.
create policy "Invitee can read own invitation" on public.invitations
  for select using (
    accepted_by = auth.uid() or
    invited_by = auth.uid() or
    public.tree_role(tree_id) in ('owner', 'admin')
  );

-- Owner/Admin can update (revoke) invitations
create policy "Owners/admins can update invitations" on public.invitations
  for update using (
    public.tree_role(tree_id) in ('owner', 'admin')
  );

-- Owner/Admin can delete invitations
create policy "Owners/admins can delete invitations" on public.invitations
  for delete using (
    public.tree_role(tree_id) in ('owner', 'admin')
  );

-- RPC: look up an invitation by token (safe — used in unauthenticated join flow)
create or replace function public.get_invitation_by_token(p_token text)
returns table (
  id          uuid,
  tree_id     uuid,
  tree_name   text,
  role        text,
  status      text,
  expires_at  timestamptz,
  person_id   uuid,
  person_name text
)
language sql security definer as $$
  select
    i.id,
    i.tree_id,
    ft.name as tree_name,
    i.role,
    i.status,
    i.expires_at,
    i.person_id,
    p.full_name as person_name
  from public.invitations i
  join public.family_trees ft on ft.id = i.tree_id
  left join public.persons p on p.id = i.person_id
  where i.token = p_token
  limit 1;
$$;

-- RPC: accept an invitation (authenticated user accepts and joins the tree)
create or replace function public.accept_invitation(p_token text)
returns json
language plpgsql security definer as $$
declare
  v_inv public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  -- Fetch invitation
  select * into v_inv from public.invitations where token = p_token limit 1;

  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_inv.status != 'pending' then
    raise exception 'Invitation is no longer valid (status: %)', v_inv.status;
  end if;
  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Invitation has expired';
  end if;

  -- Check not already a member
  if exists (select 1 from public.tree_members where tree_id = v_inv.tree_id and user_id = v_uid) then
    raise exception 'You are already a member of this tree';
  end if;

  -- Add to tree_members
  insert into public.tree_members (tree_id, user_id, role, invited_by)
  values (v_inv.tree_id, v_uid, v_inv.role, v_inv.invited_by);

  -- Link person record if pre-created
  if v_inv.person_id is not null then
    update public.persons set linked_user_id = v_uid where id = v_inv.person_id;
  end if;

  -- Mark invitation accepted
  update public.invitations
  set status = 'accepted', accepted_by = v_uid, updated_at = now()
  where id = v_inv.id;

  return json_build_object('tree_id', v_inv.tree_id);
end;
$$;
