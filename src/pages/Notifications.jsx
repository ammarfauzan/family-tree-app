import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useNotifications } from '../hooks/useNotifications';

const NOTIF_META = {
  profile_updated: { icon: '✏️', label: 'Profile Updated', color: 'text-brand-400' },
  tree_invite: { icon: '🌳', label: 'Added to Tree', color: 'text-green-400' },
  birthday_reminder: { icon: '🎂', label: 'Birthday', color: 'text-amber-400' },
  deletion_request: { icon: '🗑️', label: 'Deletion Request', color: 'text-red-400' },
};

function NotifMessage({ type, payload }) {
  const tree_id = payload?.tree_id;
  const person_id = payload?.person_id;
  const person_name = payload?.person_name;

  if (type === 'profile_updated') {
    return (
      <span>
        Your profile <strong className="text-white">{person_name && `(${person_name})`}</strong> was updated by another member.{' '}
        {tree_id && person_id && (
          <Link
            to={`/trees/${tree_id}/members/${person_id}`}
            className="text-brand-400 hover:text-brand-300 underline"
          >
            View profile →
          </Link>
        )}
      </span>
    );
  }
  if (type === 'tree_invite') {
    return (
      <span>
        You were added to a family tree.{' '}
        {tree_id && (
          <Link to={`/trees/${tree_id}`} className="text-brand-400 hover:text-brand-300 underline">
            Open tree →
          </Link>
        )}
      </span>
    );
  }
  if (type === 'birthday_reminder') {
    return (
      <span>
        🎂 Birthday reminder: <strong className="text-white">{person_name}</strong>
      </span>
    );
  }
  return <span className="text-slate-400">New notification</span>;
}

export default function Notifications() {
  const { listNotifications, markAllRead, deleteNotification } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listNotifications()
      .then((data) => {
        setNotifications(data);
        // Mark all read when page opens
        if (data.some((n) => !n.is_read)) markAllRead().catch(console.error);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id) {
    await deleteNotification(id).catch(console.error);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {unread.length > 0 ? `${unread.length} unread` : 'All caught up!'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">🔔</div>
            <h2 className="text-lg font-semibold text-white">No notifications yet</h2>
            <p className="text-slate-500 text-sm">We'll let you know when something happens.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const meta = NOTIF_META[n.type] || { icon: '🔔', label: 'Notification', color: 'text-slate-400' };
              const payload = n.payload || {};
              return (
                <div
                  key={n.id}
                  className={`card flex items-start gap-4 transition-all ${
                    !n.is_read ? 'border-brand-800 bg-slate-900/80' : 'opacity-70'
                  }`}
                >
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                        {meta.label}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      <NotifMessage type={n.type} payload={payload} />
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-lg flex-shrink-0 leading-none"
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
