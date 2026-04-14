import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useMembers } from '../hooks/useMembers';
import { supabase } from '../lib/supabaseClient';

export default function AddMember() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { addMember, getMembers } = useMembers();

  const [existingMembers, setExistingMembers] = useState([]);
  const [form, setForm] = useState({
    fullName: '', gender: '', birthDate: '', birthPlace: '',
    relationType: '', relatedToId: '', relationNote: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Linked user state
  const [userEmail, setUserEmail] = useState('');
  const [linkedUser, setLinkedUser] = useState(null); // { id, full_name, email }
  const [userSearching, setUserSearching] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  useEffect(() => {
    getMembers(treeId).then(setExistingMembers).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeId]);

  // Debounce email search (uses find_user_by_email RPC in Supabase)
  useEffect(() => {
    if (!userEmail.includes('@')) {
      setLinkedUser(null);
      setUserNotFound(false);
      return;
    }
    const timer = setTimeout(async () => {
      setUserSearching(true);
      setUserNotFound(false);
      setLinkedUser(null);
      const { data: authData, error } = await supabase.rpc('find_user_by_email', { p_email: userEmail });
      setUserSearching(false);
      if (error || !authData || authData.length === 0) {
        setUserNotFound(true);
      } else {
        setLinkedUser(authData[0]);
      }
    }, 600);
    return () => clearTimeout(timer);
   
  }, [userEmail]);

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (form.relatedToId && !form.relationType) errs.relationType = 'Please specify the relationship type';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setServerError('');
    try {
      await addMember({ treeId, ...form, linkedUserId: linkedUser?.id ?? null, relationNote: form.relationNote });
      navigate(`/trees/${treeId}`);
    } catch (err) {
      setServerError(err.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  }

  function change(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <Link to={`/trees/${treeId}`} className="text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Back to Tree
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 mb-1">Add Family Member</h1>
        <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 text-sm mb-8">Add a new person to this family tree.</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="card space-y-5">
          <div>
            <label className="label">Full Name *</label>
            <input id="memberFullName" type="text" className="input" placeholder="e.g. Sari Ramadhan"
              value={form.fullName} onChange={change('fullName')} />
            {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
          </div>

          <div>
            <label className="label">Gender</label>
            <select id="memberGender" className="input" value={form.gender} onChange={change('gender')}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of Birth</label>
              <input id="memberBirthDate" type="date" className="input" value={form.birthDate} onChange={change('birthDate')} />
            </div>
            <div>
              <label className="label">Place of Birth</label>
              <input id="memberBirthPlace" type="text" className="input" placeholder="City, Country"
                value={form.birthPlace} onChange={change('birthPlace')} />
            </div>
          </div>

          {/* Relationship to existing member */}
          {existingMembers.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Relationship (optional)
              </p>
              <div>
                <label className="label">Related to</label>
                <select id="relatedToId" className="input" value={form.relatedToId} onChange={change('relatedToId')}>
                  <option value="">— None —</option>
                  {existingMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              {form.relatedToId && (
                <div className="space-y-3">
                  <div>
                    <label className="label">This new person is a … of {existingMembers.find(m => m.id === form.relatedToId)?.full_name}</label>
                    <select id="relationType" className="input" value={form.relationType} onChange={change('relationType')}>
                      <option value="">Select relationship</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse / Partner</option>
                      <option value="sibling">Sibling</option>
                    </select>
                    {errors.relationType && <p className="error-msg">{errors.relationType}</p>}
                  </div>
                  {form.relationType && (
                    <div>
                      <label className="label">Relationship Note <span className="normal-case font-normal text-slate-600">(optional)</span></label>
                      <input
                        id="relationNote"
                        type="text"
                        className="input"
                        placeholder='e.g. "Adopted", "Step-sibling", "Half-sibling"'
                        value={form.relationNote}
                        onChange={change('relationNote')}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Link to registered user (optional) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Link to Registered User <span className="font-normal normal-case text-slate-600">(optional)</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400">If this person already has an account, link them so they can manage their own profile.</p>
            <div>
              <label className="label">Search by email</label>
              <input
                id="linkedUserEmail"
                type="email"
                className="input"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            {userSearching && (
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Searching…
              </p>
            )}
            {linkedUser && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-900/20 border border-green-800">
                <div>
                  <p className="text-green-300 text-sm font-medium">{linkedUser.full_name || 'Registered user'}</p>
                  <p className="text-green-600 text-xs">{userEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setLinkedUser(null); setUserEmail(''); }}
                  className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-red-400 transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
            )}
            {userNotFound && userEmail.includes('@') && (
              <p className="text-xs text-amber-500">No registered user found with that email. The member will be added as an unregistered record.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button id="saveMemberBtn" type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Add Member'}
            </button>
            <button type="button" onClick={() => navigate(`/trees/${treeId}`)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
