import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { useTree } from '../hooks/useTree';
import { useAuth } from '../hooks/useAuth';

function privacyBadge(privacy) {
  const map = {
    public: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800',
    family_only: 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800',
    private: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600',
  };
  return map[privacy] || map.private;
}

function privacyLabel(privacy) {
  const labels = { public: 'Publik', family_only: 'Keluarga', private: 'Pribadi' };
  return labels[privacy] || privacy;
}

function SkeletonCard() {
  return (
    <div className="card flex flex-col gap-4">
      <div className="h-28 rounded-xl skeleton" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 skeleton" />
        <div className="h-3 w-1/2 skeleton" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 skeleton" />
        <div className="h-9 w-20 skeleton" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { listTrees, deleteTree } = useTree();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirm modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listTrees()
      .then(setTrees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTree(deleteTarget.id);
      setTrees((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success(`Pohon "${deleteTarget.name}" berhasil dihapus.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const displayName = user?.user_metadata?.full_name || 'Pengguna';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10 page-enter">
        {/* Welcome + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Halo, {firstName}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Kelola dan jelajahi silsilah keluargamu
            </p>
          </div>
          <Link to="/trees/new" className="btn-primary w-full sm:w-auto">
            + Buat Pohon Baru
          </Link>
        </div>

        {/* Quick Stats */}
        {!loading && !error && trees.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="card flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-lg">
                🌳
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{trees.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pohon Keluarga</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 text-lg">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {trees.filter((t) => t.role === 'owner').length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Milik Sendiri</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 py-4 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-lg">
                🤝
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {trees.filter((t) => t.role !== 'owner').length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Diundang Bergabung</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && trees.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <div className="text-7xl">🌱</div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Belum ada pohon keluarga</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Mulai abadikan silsilah keluargamu sekarang. Buat pohon pertamamu dan undang anggota keluarga untuk berkontribusi.
            </p>
            <Link to="/trees/new" className="btn-primary inline-flex">
              🌳 Buat Pohon Pertamamu
            </Link>
          </div>
        )}

        {!loading && trees.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <div
                key={tree.id}
                className="card card-hover flex flex-col gap-4 group"
              >
                {/* Cover */}
                <div
                  className="h-28 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 dark:from-brand-800 dark:to-slate-800 flex items-center justify-center overflow-hidden cursor-pointer relative"
                  onClick={() => navigate(`/trees/${tree.id}`)}
                >
                  {tree.cover_photo ? (
                    <img src={tree.cover_photo} alt={tree.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{tree.symbol || '🌳'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className="font-semibold text-slate-900 dark:text-white text-base truncate cursor-pointer group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center gap-2"
                      onClick={() => navigate(`/trees/${tree.id}`)}
                    >
                      {!tree.cover_photo && <span className="text-base">{tree.symbol || '🌳'}</span>}
                      {tree.name}
                    </h2>
                    <span className={`badge flex-shrink-0 ${privacyBadge(tree.privacy)}`}>
                      {privacyLabel(tree.privacy)}
                    </span>
                  </div>
                  {tree.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">{tree.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/trees/${tree.id}`)}
                    className="btn-secondary text-xs flex-1"
                  >
                    Buka
                  </button>
                  {tree.role === 'owner' && (
                    <button
                      onClick={() => setDeleteTarget(tree)}
                      className="btn-danger text-xs px-3"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Pohon Keluarga?"
        message={`Apakah kamu yakin ingin menghapus "${deleteTarget?.name}"? Semua data anggota dan hubungan di dalamnya akan hilang. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
