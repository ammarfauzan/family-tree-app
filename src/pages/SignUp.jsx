import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!/\d/.test(form.password)) errs.password = 'Password must contain at least one number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
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
      setServerError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function change(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create your account</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Start building your family's story today</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">Full Name</label>
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
              placeholder="you@example.com"
              value={form.email}
              onChange={change('email')}
            />
            {errors.email && <p className="error-msg">{errors.email}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="At least 8 chars + 1 number"
              value={form.password}
              onChange={change('password')}
            />
            {errors.password && <p className="error-msg">{errors.password}</p>}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={change('confirm')}
            />
            {errors.confirm && <p className="error-msg">{errors.confirm}</p>}
          </div>

          <button
            id="signUpBtn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
