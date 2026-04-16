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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Dashboard
        </Link>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm mt-4">
            {error}
          </div>
        )}

        {tree && (
          <>
            {/* Tree Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 mt-2">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tree.name}</h1>
                {tree.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{tree.description}</p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap flex-shrink-0">
                <button
                  id="inviteMembersBtn"
                  onClick={() => navigate(`/trees/${treeId}/invite`)}
                  className="btn-secondary text-sm"
                >
                  👥 Invite
                </button>
                <button
                  id="addMemberBtn"
                  onClick={() => navigate(`/trees/${treeId}/members/new`)}
                  className="btn-primary text-sm"
                >
                  + Add Member
                </button>
                <button
                  onClick={() => navigate(`/trees/${treeId}/bulk-upload`)}
                  className="btn-secondary text-sm border-brand-500 text-brand-600 hover:bg-brand-50"
                  title="Upload CSV to add many members at once"
                >
                  📄 Bulk Upload
                </button>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 w-fit border border-slate-200 dark:border-slate-800">
              {[
                { id: 'list', label: '☰ List' },
                { id: 'tree', label: '🌳 Tree View' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === v.id
                      ? 'bg-brand-600 text-slate-900 dark:text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white'
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
                    <div className="text-5xl">👤</div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No members yet</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Add the first person to this tree</p>
                    <button
                      onClick={() => navigate(`/trees/${treeId}/members/new`)}
                      className="btn-primary"
                    >
                      + Add Member
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
