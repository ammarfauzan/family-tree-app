import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useTree() {
  const { user } = useAuth();

  async function listTrees() {
    const { data, error } = await supabase
      .from('tree_members')
      .select(`
        role,
        family_trees (
          id, name, description, privacy, cover_photo, owner_id, created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { referencedTable: 'family_trees', ascending: false });

    if (error) throw error;
    return data.map((row) => ({ ...row.family_trees, role: row.role }));
  }

  async function createTree({ name, description, privacy }) {
    // Insert tree
    const { data: tree, error: treeError } = await supabase
      .from('family_trees')
      .insert({ name, description, privacy, owner_id: user.id })
      .select()
      .single();

    if (treeError) throw treeError;

    // Add creator as owner in tree_members
    const { error: memberError } = await supabase
      .from('tree_members')
      .insert({ tree_id: tree.id, user_id: user.id, role: 'owner' });

    if (memberError) throw memberError;
    return tree;
  }

  async function getTree(treeId) {
    const { data, error } = await supabase
      .from('family_trees')
      .select('*')
      .eq('id', treeId)
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteTree(treeId) {
    const { error } = await supabase
      .from('family_trees')
      .delete()
      .eq('id', treeId)
      .eq('owner_id', user.id);
    if (error) throw error;
  }

  return { listTrees, createTree, getTree, deleteTree };
}
