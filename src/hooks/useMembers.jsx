import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useMembers() {
  const { user } = useAuth();

  async function getMembers(treeId) {
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('tree_id', treeId)
      .order('full_name');
    if (error) throw error;
    return data;
  }

  async function getMember(personId) {
    const { data, error } = await supabase
      .from('persons')
      .select('*, relationships!person_a_id(*), person_gallery(*)')
      .eq('id', personId)
      .single();
    if (error) throw error;
    return data;
  }

  async function addMember({ treeId, fullName, gender, birthDate, birthPlace, relationType, relatedToId, linkedUserId, relationNote }) {
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert({
        tree_id: treeId,
        full_name: fullName,
        gender: gender || 'unknown',
        birth_date: birthDate || null,
        birth_place: birthPlace || null,
        linked_user_id: linkedUserId || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (personError) throw personError;

    // Create relationship + bidirectional inverse (REL-03)
    if (relatedToId && relationType) {
      const inverseType = {
        parent: 'child',
        child: 'parent',
        spouse: 'spouse',
        sibling: 'sibling',
      }[relationType];

      // Forward: relatedTo → new person
      const { error: relError } = await supabase.from('relationships').insert({
        tree_id: treeId,
        person_a_id: relatedToId,
        person_b_id: person.id,
        relation_type: relationType,
        relation_note: relationNote || null,
        created_by: user.id,
      });
      if (relError) throw relError;

      // Inverse: new person → relatedTo (bidirectional, REL-03)
      const { error: invError } = await supabase.from('relationships').insert({
        tree_id: treeId,
        person_a_id: person.id,
        person_b_id: relatedToId,
        relation_type: inverseType,
        relation_note: relationNote || null,
        created_by: user.id,
      });
      if (invError) throw invError;
    }

    return person;
  }

  async function updateMember(personId, updates) {
    const { data, error } = await supabase
      .from('persons')
      .update({ ...updates, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', personId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteMember(personId) {
    // Remove relationships first
    await supabase.from('relationships').delete()
      .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`);
    // Remove gallery
    await supabase.from('person_gallery').delete().eq('person_id', personId);
    // Remove person
    const { error } = await supabase.from('persons').delete().eq('id', personId);
    if (error) throw error;
  }

  return { getMembers, getMember, addMember, updateMember, deleteMember };
}
