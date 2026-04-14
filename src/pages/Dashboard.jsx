import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useTree } from '../hooks/useTree';

function privacyBadge(privacy) {
  const map = {
    public: 'bg-green-900/50 text-green-400 border border-green-800',
    family_only: 'bg-brand-900/50 text-brand-300 border border-brand-800',
    private: 'bg-slate-700 text-slate-300 border border-slate-600',
  };
  return map[privacy] || map.private;
}

export default function Dashboard() {
  const { listTrees, deleteTree } = useTree();
  const navigate = useNavigate();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  useEffect(() => {
    listTrees()
      .then(setTrees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(tree) {
    if (!window.confirm(`Delete "${tree.name}"? This cannot be undone.`)) return;
    setDeleting(tree.id);
    try {
      await deleteTree(tree.id);
      setTrees((prev) => prev.filter((t) => t.id !== tree.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Family Trees</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and explore your family genealogy</p>
          </div>
          <Link to="/trees/new" className="btn-primary">
            + New Tree
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && trees.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <div className="text-6xl">🌱</div>
            <h2 className="text-xl font-semibold text-white">No trees yet</h2>
            <p className="text-slate-500 text-sm">Start by creating your first family tree</p>
            <Link to="/trees/new" className="btn-primary inline-flex">Create a Tree</Link>
          </div>
        )}

        {!loading && trees.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <div
                key={tree.id}
                className="card flex flex-col gap-4 hover:border-brand-700 transition-all group"
              >
                {/* Cover */}
                <div
                  className="h-28 rounded-xl bg-gradient-to-br from-brand-800 to-slate-800 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/trees/${tree.id}`)}
                >
                  {tree.cover_photo ? (
                    <img src={tree.cover_photo} alt={tree.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl opacity-40">🌳</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className="font-semibold text-white text-base truncate cursor-pointer group-hover:text-brand-300 transition-colors"
                      onClick={() => navigate(`/trees/${tree.id}`)}
                    >
                      {tree.name}
                    </h2>
                    <span className={`badge flex-shrink-0 ${privacyBadge(tree.privacy)}`}>
                      {tree.privacy.replace('_', ' ')}
                    </span>
                  </div>
                  {tree.description && (
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{tree.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/trees/${tree.id}`)}
                    className="btn-secondary text-xs flex-1"
                  >
                    Open
                  </button>
                  {tree.role === 'owner' && (
                    <button
                      onClick={() => handleDelete(tree)}
                      disabled={deleting === tree.id}
                      className="btn-danger text-xs px-3"
                    >
                      {deleting === tree.id ? '…' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
