import { Link } from 'react-router-dom';

export default function EmailVerify() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md text-center">
        <div className="text-6xl mb-5">✉️</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verify your email</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
          We've sent a verification link to your email address.
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-8">
          Click the link in the email to activate your account. Check your spam folder if you don't
          see it within a few minutes.
        </p>

        <div className="space-y-3">
          <Link to="/sign-in" className="btn-primary block w-full">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
