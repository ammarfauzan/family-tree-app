import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useInvitation } from '../hooks/useInvitation';
import { useMembers } from '../hooks/useMembers';

function roleBadge(role) {
  const map = {
    owner: 'bg-amber-900/50 text-amber-300 border-amber-700',
    admin: 'bg-brand-900/50 text-brand-300 border-brand-800',
    member: 'bg-slate-700 text-slate-300 border-slate-600',
    viewer: 'bg-slate-800 text-slate-500 border-slate-700',
  };
  return map[role] || map.member;
}

export default function InviteMembers() {
  const { treeId } = useParams();
  const { createInvitation, listInvitations, revokeInvitation, getTreeMembers, removeMember } = useInvitation();
  const { getMembers } = useMembers();

  const [invites, setInvites] = useState([]);
  const [treeMembers, setTreeMembers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [tab, setTab] = useState('invite'); // 'invite' | 'members'

  const [form, setForm] = useState({ role: 'member', personId: '' });
  useEffect(() => {
    Promise.all([listInvitations(treeId), getTreeMembers(treeId), getMembers(treeId)])
      .then(([inv, mem, per]) => {
        setInvites(inv);
        setTreeMembers(mem);
        // Only persons not yet linked to a user
        setPersons(per.filter((p) => !p.linked_user_id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeId]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const inv = await createInvitation({
        treeId,
        role: form.role,
        personId: form.personId || null,
      });
      setInvites((prev) => [inv, ...prev]);
      setForm({ role: 'member', personId: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(inv) {
    if (!window.confirm('Revoke this invite link?')) return;
    try {
      await revokeInvitation(inv.id);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Remove ${member.profiles?.full_name || 'this member'} from the tree?`)) return;
    try {
      await removeMember(treeId, member.user_id);
      setTreeMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
    } catch (err) {
      alert(err.message);
    }
  }

  function copyLink(token) {
    const url = `${window.location.origin}/join?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function inviteLink(token) {
    return `${window.location.origin}/join?token=${token}`;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to={`/trees/${treeId}`}
          className="text-slate-500 hover:text-slate-300 text-sm mb-6 inline-flex items-center gap-1"
        >
          ← Back to Tree
        </Link>

        <div className="flex items-center justify-between mt-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Invite & Members</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage who has access to this tree.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-xl mb-6 w-fit border border-slate-800">
          {[
            { id: 'invite', label: '🔗 Invite Links' },
            { id: 'members', label: '👥 Members' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'invite' ? (
          <div className="space-y-6">
            {/* Create invite form */}
            <div className="card space-y-4">
              <h2 className="text-base font-semibold text-white">Generate Invite Link</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Role</label>
                    <select
                      id="inviteRole"
                      className="input"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      <option value="viewer">Viewer — read only</option>
                      <option value="member">Member — can edit</option>
                      <option value="admin">Admin — full control</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Link to Person <span className="normal-case font-normal text-slate-600">(optional)</span></label>
                    <select
                      id="invitePersonId"
                      className="input"
                      value={form.personId}
                      onChange={(e) => setForm((f) => ({ ...f, personId: e.target.value }))}
                    >
                      <option value="">— None —</option>
                      {persons.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  id="generateInviteBtn"
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? 'Generating…' : '+ Generate Link'}
                </button>
              </form>
            </div>

            {/* Active invites */}
            {invites.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No invite links yet. Generate one above.
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Active Links</h2>
                {invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="card flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`badge border ${roleBadge(inv.role)}`}>{inv.role}</span>
                        <span className={`badge border ${
                          inv.status === 'accepted'
                            ? 'bg-green-900/40 text-green-400 border-green-800'
                            : inv.status === 'expired'
                            ? 'bg-slate-800 text-slate-500 border-slate-700'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {inviteLink(inv.token)}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Expires {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyLink(inv.token)}
                        className={`btn-secondary text-xs px-3 py-1.5 ${
                          copiedId === inv.token ? 'text-green-400 border-green-700' : ''
                        }`}
                      >
                        {copiedId === inv.token ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(inv)}
                          className="btn-danger text-xs px-3 py-1.5"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Members tab */
          <div className="space-y-3">
            {treeMembers.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-12">No members found.</p>
            ) : (
              treeMembers.map((member) => (
                <div key={member.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(member.profiles?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 text-sm">
                      {member.profiles?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge border ${roleBadge(member.role)}`}>{member.role}</span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-slate-500 hover:text-red-400 text-xs transition-colors px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
