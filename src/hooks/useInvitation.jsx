import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useInvitation() {
  const { user } = useAuth();

  /** Create a new invitation and return the full row (including token) */
  async function createInvitation({ treeId, role = 'member', email = null, personId = null }) {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        tree_id: treeId,
        invited_by: user.id,
        role,
        email: email || null,
        person_id: personId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** List all invitations for a tree */
  async function listInvitations(treeId) {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('tree_id', treeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /** Revoke / delete an invitation */
  async function revokeInvitation(invitationId) {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);
    if (error) throw error;
  }

  /** Look up an invitation by token (public — works before auth) */
  async function getInvitationByToken(token) {
    const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token });
    if (error) throw error;
    return data?.[0] ?? null;
  }

  /** Accept an invitation — user must be authenticated */
  async function acceptInvitation(token) {
    const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
    if (error) throw error;
    return data;
  }

  /** Remove a user from a tree (owner/admin only) */
  async function removeMember(treeId, userId) {
    const { error } = await supabase
      .from('tree_members')
      .delete()
      .eq('tree_id', treeId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  /** Get all tree members with their profile info */
  async function getTreeMembers(treeId) {
    const { data, error } = await supabase
      .from('tree_members')
      .select('*, profiles(full_name, avatar_url)')
      .eq('tree_id', treeId)
      .order('joined_at');
    if (error) throw error;
    return data;
  }

  return {
    createInvitation,
    listInvitations,
    revokeInvitation,
    getInvitationByToken,
    acceptInvitation,
    removeMember,
    getTreeMembers,
  };
}
