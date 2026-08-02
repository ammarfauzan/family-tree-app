import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes('@')) { setError('Masukkan alamat email yang valid'); return; }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
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
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cek emailmu</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Kami telah mengirim link reset password ke <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
              Link berlaku selama 1 jam.
            </p>
            <Link to="/sign-in" className="btn-primary">Kembali ke Halaman Masuk</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Lupa Password</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Masukkan email akunmu dan kami akan mengirimkan link reset.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  id="resetEmail"
                  type="email"
                  className="input"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                id="sendResetBtn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Mengirim…' : 'Kirim Link Reset'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              <Link to="/sign-in" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium">
                ← Kembali ke Halaman Masuk
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
