import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function PasswordStrength({ password }) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Lemah', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'Cukup', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'Bagus', color: 'bg-brand-500' };
    return { level: 4, label: 'Sangat Kuat', color: 'bg-green-500' };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength.level <= 1 ? 'text-red-500' :
        strength.level <= 2 ? 'text-amber-500' :
        strength.level <= 3 ? 'text-brand-600 dark:text-brand-400' :
        'text-green-600 dark:text-green-400'
      }`}>
        Kekuatan: {strength.label}
      </p>
    </div>
  );
}

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Nama lengkap wajib diisi';
    if (!form.email.includes('@')) errs.email = 'Masukkan email yang valid';
    if (form.password.length < 8) errs.password = 'Password minimal 8 karakter';
    else if (!/\d/.test(form.password)) errs.password = 'Password harus mengandung minimal satu angka';
    if (form.password !== form.confirm) errs.confirm = 'Password tidak cocok';
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
      await signUp({ email: form.email, password: form.password, fullName: form.fullName });
      navigate('/email-verify');
    } catch (err) {
      setServerError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  function change(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950">
      {/* Decorative blobs */}
      <div className="fixed -top-40 -left-40 w-80 h-80 rounded-full bg-brand-200/30 dark:bg-brand-800/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-80 h-80 rounded-full bg-brand-300/20 dark:bg-brand-900/10 blur-3xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md relative z-10 page-enter">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Buat Akun Baru</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Mulai abadikan kisah keluargamu hari ini</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              className="input"
              placeholder="Ahmad Ramadhan"
              value={form.fullName}
              onChange={change('fullName')}
            />
            {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
          </div>

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
                autoComplete="new-password"
                className="input pr-10"
                placeholder="Minimal 8 karakter + 1 angka"
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
            <PasswordStrength password={form.password} />
            {errors.password && <p className="error-msg">{errors.password}</p>}
          </div>

          <div>
            <label className="label">Konfirmasi Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className="input pr-10"
                placeholder="Ulangi password"
                value={form.confirm}
                onChange={change('confirm')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm"
                tabIndex={-1}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.confirm && <p className="error-msg">{errors.confirm}</p>}
          </div>

          <button
            id="signUpBtn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Membuat akun…' : 'Buat Akun'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Sudah punya akun?{' '}
          <Link to="/sign-in" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
