import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { MemberCard } from '../components/MemberCard';
import { TreeVisualization } from '../components/TreeVisualization';
import { SearchPanel } from '../components/SearchPanel';
import { useTree } from '../hooks/useTree';
import { useMembers } from '../hooks/useMembers';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

function SkeletonMemberCard() {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/5 skeleton" />
        <div className="h-3 w-2/5 skeleton" />
      </div>
    </div>
  );
}

export default function TreeDetail() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { getTree } = useTree();
  const { getMembers } = useMembers();
  const { user } = useAuth();

  const [tree, setTree] = useState(null);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'tree'

  useEffect(() => {
    async function load() {
      try {
        const [t, m] = await Promise.all([getTree(treeId), getMembers(treeId)]);
        setTree(t);
        setMembers(m);
        const { data: rels } = await supabase
          .from('relationships')
          .select('*')
          .eq('tree_id', treeId);
        setRelationships(rels || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeId]);

  const livingCount = members.filter((m) => !m.is_deceased).length;
  const deceasedCount = members.filter((m) => m.is_deceased).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 page-enter">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-white font-medium truncate">
            {tree?.name || 'Memuat…'}
          </span>
        </nav>

        {loading && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-8 w-64 skeleton" />
              <div className="h-4 w-96 skeleton" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonMemberCard />
              <SkeletonMemberCard />
              <SkeletonMemberCard />
              <SkeletonMemberCard />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm mt-4">
            {error}
          </div>
        )}

        {tree && (
          <>
            {/* Tree Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tree.name}</h1>
                {tree.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{tree.description}</p>
                )}
                {/* Stats row */}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    👥 <strong className="text-slate-700 dark:text-slate-300">{members.length}</strong> anggota
                  </span>
                  {livingCount > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      💚 {livingCount} hidup
                    </span>
                  )}
                  {deceasedCount > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      🕊️ {deceasedCount} almarhum
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap flex-shrink-0">
                <button
                  id="inviteMembersBtn"
                  onClick={() => navigate(`/trees/${treeId}/invite`)}
                  className="btn-secondary text-sm"
                >
                  👥 Undang
                </button>
                <button
                  id="addMemberBtn"
                  onClick={() => navigate(`/trees/${treeId}/members/new`)}
                  className="btn-primary text-sm"
                >
                  + Tambah Anggota
                </button>
                <button
                  onClick={() => navigate(`/trees/${treeId}/bulk-upload`)}
                  className="btn-secondary text-sm"
                  title="Upload CSV untuk menambah banyak anggota sekaligus"
                >
                  📄 Bulk Upload
                </button>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 w-fit border border-slate-200 dark:border-slate-800">
              {[
                { id: 'list', label: '☰ Daftar' },
                { id: 'tree', label: '🌳 Pohon' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === v.id
                      ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Tree visualization view */}
            {view === 'tree' && (
              <div className="mb-6">
                <TreeVisualization
                  persons={members}
                  relationships={relationships}
                  treeId={treeId}
                  currentUserId={user?.id}
                  navigate={navigate}
                />
              </div>
            )}

            {/* List view */}
            {view === 'list' && (
              <>
                {members.length > 0 && (
                  <div className="mb-5">
                    <SearchPanel
                      persons={members}
                      relationships={relationships}
                      treeId={treeId}
                    />
                  </div>
                )}

                {members.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <div className="text-6xl">👤</div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Belum ada anggota</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Tambahkan orang pertama ke pohon ini</p>
                    <button
                      onClick={() => navigate(`/trees/${treeId}/members/new`)}
                      className="btn-primary"
                    >
                      + Tambah Anggota
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {members.map((m) => (
                      <MemberCard key={m.id} member={m} treeId={treeId} />
                    ))}
                  </div>
                )}
              </>
            )}

          </>
        )}
      </main>
    </div>
  );
}
