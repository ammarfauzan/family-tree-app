import { Link } from 'react-router-dom';

export default function EmailVerify() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950">
      <div className="fixed -bottom-40 -left-40 w-80 h-80 rounded-full bg-brand-200/30 dark:bg-brand-800/10 blur-3xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <span className="text-3xl">🌳</span>
        <span className="text-xl font-bold text-slate-900 dark:text-white">FamilyTree</span>
      </Link>

      <div className="card w-full max-w-md text-center relative z-10 page-enter">
        <div className="text-6xl mb-5">✉️</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifikasi Emailmu</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
          Kami telah mengirimkan link verifikasi ke alamat emailmu.
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-8">
          Klik link di email untuk mengaktifkan akunmu. Periksa folder spam jika
          tidak muncul dalam beberapa menit.
        </p>

        <div className="space-y-3">
          <Link to="/sign-in" className="btn-primary block w-full">
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
