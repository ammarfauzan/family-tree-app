import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      setError('Link undangan tidak valid atau tidak ada.');
      setLoading(false);
      return;
    }
    getInvitationByToken(token)
      .then((inv) => {
        if (!inv) {
          setError('Undangan tidak ditemukan atau sudah digunakan.');
        } else if (inv.status !== 'pending') {
          setError(`Undangan ini sudah tidak berlaku (${inv.status}).`);
        } else if (new Date(inv.expires_at) < new Date()) {
          setError('Link undangan ini sudah kedaluwarsa.');
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950">
      <div className="fixed -top-40 -right-40 w-80 h-80 rounded-full bg-brand-200/30 dark:bg-brand-800/10 blur-3xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md relative z-10 page-enter">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🔗</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Undangan Tidak Valid</h1>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <Link to="/dashboard" className="btn-secondary inline-flex">Ke Dashboard</Link>
          </div>
        )}

        {!loading && !error && joined && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Berhasil Bergabung!</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Selamat datang di <strong className="text-slate-900 dark:text-white">{invite?.tree_name}</strong>. Mengalihkan…</p>
            <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && !error && !joined && invite && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🌳</div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Kamu Diundang!</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Kamu telah diundang untuk bergabung ke pohon keluarga:</p>
              <p className="text-brand-700 dark:text-brand-300 font-semibold text-lg mt-2">{invite.tree_name}</p>
              {invite.person_name && (
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Kamu akan dihubungkan dengan profil: <span className="text-slate-700 dark:text-slate-300">{invite.person_name}</span>
                </p>
              )}
              <span className="badge bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mt-3 inline-flex">
                Peran: {invite.role}
              </span>
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Masuk atau buat akun untuk menerima undangan ini.</p>
                <button
                  id="joinSignInBtn"
                  onClick={() => navigate(`/sign-in?redirect=${encodeURIComponent(window.location.href)}`)}
                  className="btn-primary w-full"
                >
                  Masuk untuk Bergabung
                </button>
                <button
                  onClick={() => navigate(`/sign-up?redirect=${encodeURIComponent(window.location.href)}`)}
                  className="btn-secondary w-full"
                >
                  Buat Akun Baru
                </button>
              </div>
            ) : (
              <button
                id="acceptInviteBtn"
                onClick={handleJoin}
                disabled={joining}
                className="btn-primary w-full"
              >
                {joining ? 'Bergabung…' : `Terima & Bergabung ke ${invite.tree_name}`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
