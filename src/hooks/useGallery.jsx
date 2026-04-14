import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useGallery() {
  const { user } = useAuth();

  /** Upload a gallery photo to Supabase Storage and insert a person_gallery record */
  async function uploadPhoto(personId, file, caption = '') {
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${personId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('person-gallery')
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('person-gallery').getPublicUrl(path);

    const { data, error: insertError } = await supabase
      .from('person_gallery')
      .insert({ person_id: personId, photo_url: urlData.publicUrl, caption, uploaded_by: user.id })
      .select()
      .single();
    if (insertError) throw insertError;
    return data;
  }

  /** List gallery photos for a person */
  async function listPhotos(personId) {
    const { data, error } = await supabase
      .from('person_gallery')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /** Delete a gallery photo (record + storage object) */
  async function deletePhoto(photo) {
    // Parse the storage path from the public URL
    const url = new URL(photo.photo_url);
    const pathParts = url.pathname.split('/person-gallery/');
    if (pathParts[1]) {
      await supabase.storage.from('person-gallery').remove([pathParts[1]]);
    }
    const { error } = await supabase
      .from('person_gallery')
      .delete()
      .eq('id', photo.id)
      .eq('uploaded_by', user.id);
    if (error) throw error;
  }

  /** Upload a profile photo and return the public URL */
  async function uploadProfilePhoto(personId, file) {
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${personId}/profile.${ext}`;
    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  return { uploadPhoto, listPhotos, deletePhoto, uploadProfilePhoto };
}
