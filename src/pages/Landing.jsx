import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const FEATURES = [
  {
    icon: '🌳',
    title: 'Pohon Silsilah Interaktif',
    desc: 'Visualisasikan hubungan keluarga dalam bentuk pohon yang indah dan mudah dipahami.',
  },
  {
    icon: '📸',
    title: 'Profil Anggota Lengkap',
    desc: 'Simpan foto, biografi, dan kisah hidup setiap anggota keluarga untuk generasi mendatang.',
  },
  {
    icon: '🔗',
    title: 'Undang Keluarga Jauh',
    desc: 'Bagikan link undangan agar sanak saudara bisa bergabung dan melengkapi data bersama.',
  },
  {
    icon: '🔒',
    title: 'Privat & Aman',
    desc: 'Data keluarga terenkripsi dan hanya bisa diakses oleh anggota yang kamu undang.',
  },
  {
    icon: '📱',
    title: 'Bisa Dibuka di Mana Saja',
    desc: 'Akses dari ponsel, tablet, atau laptop kapan pun dan di mana pun kamu berada.',
  },
  {
    icon: '💾',
    title: 'Tersimpan Selamanya',
    desc: 'Ekspor silsilah ke PNG untuk kenang-kenangan fisik atau dibagikan via WhatsApp.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Budi Santoso',
    role: 'Ayah dari 3 anak, Jakarta',
    avatar: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Budi',
    text: 'Waktu reuni lebaran kemarin, sepupu-sepupu baru tahu kalau nenek kita punya 47 cucu! Sekarang semua terdokumentasi dengan rapi.',
  },
  {
    name: 'Siti Rahayu',
    role: 'Ibu rumah tangga, Yogyakarta',
    avatar: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Siti',
    text: 'Anak-anak saya yang di luar negeri akhirnya bisa kenal satu sama lain. FamilyTree jadi jembatan kita semua.',
  },
  {
    name: 'Ahmad Fauzan',
    role: 'Mahasiswa, Surabaya',
    avatar: 'https://api.dicebear.com/8.x/fun-emoji/svg?seed=Ahmad',
    text: 'Tugas sejarah keluarga jadi sangat mudah! Tinggal screenshot pohon silsilahnya dan langsung jadi dong.',
  },
];

const STEPS = [
  { num: '01', title: 'Daftar Gratis', desc: 'Buat akun dalam hitungan detik menggunakan email kamu.' },
  { num: '02', title: 'Buat Pohon Keluarga', desc: 'Namai pohon dan pilih simbol yang mencerminkan keluargamu.' },
  { num: '03', title: 'Tambah Anggota', desc: 'Isi profil setiap anggota — dari kakek-nenek hingga cucu.' },
  { num: '04', title: 'Undang Keluarga', desc: 'Kirim link undangan agar mereka bisa ikut berkontribusi.' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  function handleCTA() {
    navigate(user ? '/dashboard' : '/sign-up');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <span className="text-emerald-600">🌳</span>
            <span>FamilyTree</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors" title="Toggle theme">
              {theme === 'dark' ? '☀️' : theme === 'light' ? '🌙' : '🖥️'}
            </button>
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-500">
                Buka Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/sign-in" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors">Masuk</Link>
                <Link to="/sign-up" className="text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-950 text-white py-24 px-4">
        {/* decorative bokeh blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-800/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Ramadhan badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-semibold tracking-wide uppercase">
            🌙 Ramadan Mubarak — Momen Terbaik Merangkai Silsilah
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            Abadikan Sejarah<br />
            <span className="text-emerald-400">Keluargamu</span><br className="sm:hidden" />
            {' '}Selamanya
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Di momen mudik Ramadan ini, saat sanak keluarga berkumpul — jadikan ini
            kesempatan emas untuk mendokumentasikan silsilah keluarga. Sebuah warisan
            yang akan dikenang anak cucu.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleCTA}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-900/50 transition-all hover:scale-105"
            >
              {user ? 'Buka Dashboard →' : 'Mulai Sekarang — Gratis 🎉'}
            </button>
            <Link
              to="/sign-in"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-600 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 font-semibold text-lg transition-all"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>

          {/* mini social proof */}
          <p className="text-slate-500 text-sm pt-2">
            ✨ Gratis selamanya · Tidak perlu kartu kredit · Data tersimpan aman
          </p>
        </div>
      </section>

      {/* ── Ramadhan Quote ──────────────────────────── */}
      <section className="bg-emerald-700 dark:bg-emerald-900 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center text-white space-y-2">
          <p className="text-2xl font-bold">"Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."</p>
          <p className="text-emerald-200 text-sm">— HR. Thabrani —  Dokumentasikan kisah keluargamu, jadikan inspirasi bagi generasi penerus.</p>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Cara Kerja</span>
            <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">4 Langkah Mudah</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="relative p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl font-extrabold text-emerald-100 dark:text-emerald-900 mb-3">{step.num}</div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Fitur Unggulan</span>
            <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">Semua yang Kamu Butuhkan</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl mx-auto">
              Dirancang khusus untuk keluarga Indonesia — sederhana, lengkap, dan menyenangkan.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group bg-white dark:bg-slate-900"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Cerita Mereka</span>
            <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">Disukai Keluarga di Seluruh Indonesia</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="text-6xl">🌙</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">Mulai Ramadan dengan Langkah Bermakna</h2>
          <p className="text-emerald-200 text-lg">
            Satu klik untuk memulai — abadikan silsilah keluargamu hari ini sebelum momen Ramadan berlalu.
          </p>
          <button
            onClick={handleCTA}
            className="inline-block px-10 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-bold text-lg shadow-lg shadow-yellow-900/30 transition-all hover:scale-105"
          >
            {user ? 'Buka Dashboard →' : 'Daftar Sekarang — Gratis 🎉'}
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">🌳</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">FamilyTree</span>
            <span>— Abadikan silsilah, warisi cerita.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/sign-in" className="hover:text-emerald-600 transition-colors">Masuk</Link>
            <Link to="/sign-up" className="hover:text-emerald-600 transition-colors">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
