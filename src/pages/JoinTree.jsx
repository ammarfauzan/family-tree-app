import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useInvitation } from '../hooks/useInvitation';

export default function JoinTree() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getInvitationByToken, acceptInvitation } = useInvitation();

  const token = new URLSearchParams(window.location.search).get('token');

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation link.');
      setLoading(false);
      return;
    }
    getInvitationByToken(token)
      .then((inv) => {
        if (!inv) {
          setError('Invitation not found or has already been used.');
        } else if (inv.status !== 'pending') {
          setError(`This invitation is no longer valid (${inv.status}).`);
        } else if (new Date(inv.expires_at) < new Date()) {
          setError('This invitation link has expired.');
        } else {
          setInvite(inv);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleJoin() {
    if (!user) {
      // Redirect to sign in, preserving the join URL
      navigate(`/sign-in?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }
    setJoining(true);
    try {
      const result = await acceptInvitation(token);
      setJoined(true);
      setTimeout(() => navigate(`/trees/${result.tree_id}`), 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🔗</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Invalid Invitation</h1>
            <p className="text-red-400 text-sm">{error}</p>
            <Link to="/dashboard" className="btn-secondary inline-flex">Go to Dashboard</Link>
          </div>
        )}

        {!loading && !error && joined && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">You're in!</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Welcome to <strong className="text-slate-900 dark:text-white">{invite?.tree_name}</strong>. Redirecting…</p>
            <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && !error && !joined && invite && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🌳</div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">You're Invited!</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">You've been invited to join the family tree:</p>
              <p className="text-brand-300 font-semibold text-lg mt-2">{invite.tree_name}</p>
              {invite.person_name && (
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  You'll be linked to the profile: <span className="text-slate-700 dark:text-slate-300">{invite.person_name}</span>
                </p>
              )}
              <span className="badge bg-brand-900/50 text-brand-300 border border-brand-800 mt-3 inline-flex">
                Role: {invite.role}
              </span>
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Sign in or create an account to accept this invitation.</p>
                <button
                  id="joinSignInBtn"
                  onClick={() => navigate(`/sign-in?redirect=${encodeURIComponent(window.location.href)}`)}
                  className="btn-primary w-full"
                >
                  Sign In to Accept
                </button>
                <button
                  onClick={() => navigate(`/sign-up?redirect=${encodeURIComponent(window.location.href)}`)}
                  className="btn-secondary w-full"
                >
                  Create an Account
                </button>
              </div>
            ) : (
              <button
                id="acceptInviteBtn"
                onClick={handleJoin}
                disabled={joining}
                className="btn-primary w-full"
              >
                {joining ? 'Joining…' : `Accept & Join ${invite.tree_name}`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
