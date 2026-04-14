import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();

  /** Fetch all notifications for current user, newest first */
  async function listNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  }

  /** Get unread count */
  async function getUnreadCount() {
    const { data, error } = await supabase.rpc('unread_notification_count');
    if (error) throw error;
    return data ?? 0;
  }

  /** Mark all as read */
  async function markAllRead() {
    const { error } = await supabase.rpc('mark_notifications_read');
    if (error) throw error;
  }

  /** Mark a single notification as read */
  async function markRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);
    if (error) throw error;
  }

  /** Delete a notification */
  async function deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);
    if (error) throw error;
  }

  return { listNotifications, getUnreadCount, markAllRead, markRead, deleteNotification };
}
