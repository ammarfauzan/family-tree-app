import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPw, setShowPw] = useState(false);

  function validate() {
    const errs = {};
    if (!form.email.includes('@')) errs.email = 'Masukkan email yang valid';
    if (!form.password) errs.password = 'Password wajib diisi';
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
      await signIn({ email: form.email, password: form.password, remember: form.remember });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Gagal masuk. Periksa kembali email dan password kamu.');
    } finally {
      setLoading(false);
    }
  }

  function change(field) {
    return (e) => setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950">
      {/* Decorative blobs */}
      <div className="fixed -top-40 -right-40 w-80 h-80 rounded-full bg-brand-200/30 dark:bg-brand-800/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 rounded-full bg-brand-300/20 dark:bg-brand-900/10 blur-3xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md relative z-10 page-enter">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Selamat Datang Kembali</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Masuk untuk melanjutkan ke pohon keluargamu</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input"
              placeholder="contoh@email.com"
              value={form.email}
              onChange={change('email')}
            />
            {errors.email && <p className="error-msg">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-10"
                placeholder="Masukkan password"
                value={form.password}
                onChange={change('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm"
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="error-msg">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="rememberMe"
                type="checkbox"
                className="w-4 h-4 accent-brand-500 rounded"
                checked={form.remember}
                onChange={change('remember')}
              />
              <span className="text-slate-600 dark:text-slate-400">Ingat saya</span>
            </label>
            <Link to="/reset-password" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium">
              Lupa password?
            </Link>
          </div>

          <button
            id="signInBtn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Belum punya akun?{' '}
          <Link to="/sign-up" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
