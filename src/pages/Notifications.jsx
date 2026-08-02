import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useNotifications } from '../hooks/useNotifications';

const NOTIF_META = {
  profile_updated: { icon: '✏️', label: 'Profil Diperbarui', color: 'text-brand-600 dark:text-brand-400' },
  tree_invite: { icon: '🌳', label: 'Ditambahkan ke Pohon', color: 'text-green-600 dark:text-green-400' },
  birthday_reminder: { icon: '🎂', label: 'Ulang Tahun', color: 'text-amber-600 dark:text-amber-400' },
  deletion_request: { icon: '🗑️', label: 'Permintaan Hapus', color: 'text-red-600 dark:text-red-400' },
};

function NotifMessage({ type, payload }) {
  const tree_id = payload?.tree_id;
  const person_id = payload?.person_id;
  const person_name = payload?.person_name;

  if (type === 'profile_updated') {
    return (
      <span>
        Profil <strong className="text-slate-900 dark:text-white">{person_name && `(${person_name})`}</strong> telah diperbarui oleh anggota lain.{' '}
        {tree_id && person_id && (
          <Link
            to={`/trees/${tree_id}/members/${person_id}`}
            className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 underline"
          >
            Lihat profil →
          </Link>
        )}
      </span>
    );
  }
  if (type === 'tree_invite') {
    return (
      <span>
        Kamu telah ditambahkan ke sebuah pohon keluarga.{' '}
        {tree_id && (
          <Link to={`/trees/${tree_id}`} className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 underline">
            Buka pohon →
          </Link>
        )}
      </span>
    );
  }
  if (type === 'birthday_reminder') {
    return (
      <span>
        🎂 Pengingat ulang tahun: <strong className="text-slate-900 dark:text-white">{person_name}</strong>
      </span>
    );
  }
  return <span className="text-slate-600 dark:text-slate-400">Notifikasi baru</span>;
}

function SkeletonNotif() {
  return (
    <div className="card flex items-start gap-4">
      <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-3 w-32 skeleton" />
      </div>
    </div>
  );
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
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10 page-enter">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifikasi</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {unread.length > 0 ? `${unread.length} belum dibaca` : 'Semua sudah dibaca! ✨'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <SkeletonNotif />
            <SkeletonNotif />
            <SkeletonNotif />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-6xl">🔔</div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Belum ada notifikasi</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Kami akan memberitahumu saat ada aktivitas baru.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const meta = NOTIF_META[n.type] || { icon: '🔔', label: 'Notifikasi', color: 'text-slate-600 dark:text-slate-400' };
              const payload = n.payload || {};
              return (
                <div
                  key={n.id}
                  className={`card flex items-start gap-4 transition-all ${
                    !n.is_read ? 'border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30' : 'opacity-70'
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
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      <NotifMessage type={n.type} payload={payload} />
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors text-lg flex-shrink-0 leading-none rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 w-8 h-8 flex items-center justify-center"
                    title="Hapus"
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
