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
  });
  const [relations, setRelations] = useState([
    { id: Date.now(), relatedToId: '', relationType: '', relationNote: '' }
  ]);
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
    relations.forEach((rel, index) => {
      if (rel.relatedToId && !rel.relationType) {
        errs[`relationType_${index}`] = 'Please specify the relationship type';
      }
    });
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
      await addMember({ treeId, ...form, relations, linkedUserId: linkedUser?.id ?? null });
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
        <Link to={`/trees/${treeId}`} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Kembali ke Pohon
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 mb-1">Tambah Anggota Keluarga</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Tambahkan orang baru ke pohon keluarga ini.</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="card space-y-5">
          <div>
            <label className="label">Nama Lengkap *</label>
            <input id="memberFullName" type="text" className="input" placeholder="contoh: Sari Ramadhan"
              value={form.fullName} onChange={change('fullName')} />
            {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
          </div>

          <div>
            <label className="label">Jenis Kelamin</label>
            <select id="memberGender" className="input" value={form.gender} onChange={change('gender')}>
              <option value="">Pilih jenis kelamin</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
              <option value="other">Lainnya</option>
              <option value="unknown">Tidak diketahui</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Lahir</label>
              <input id="memberBirthDate" type="date" className="input" value={form.birthDate} onChange={change('birthDate')} />
            </div>
            <div>
              <label className="label">Tempat Lahir</label>
              <input id="memberBirthPlace" type="text" className="input" placeholder="Kota, Negara"
                value={form.birthPlace} onChange={change('birthPlace')} />
            </div>
          </div>

          {/* Relationships to existing members */}
          {existingMembers.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Hubungan Keluarga (opsional)
                </p>
                <button
                  type="button"
                  onClick={() => setRelations([...relations, { id: Date.now() + Math.random(), relatedToId: '', relationType: '', relationNote: '' }])}
                  className="text-xs font-medium text-brand-600 hover:text-brand-500 transition-colors"
                >
                  + Tambah hubungan lain
                </button>
              </div>

              {relations.map((rel, index) => (
                <div key={rel.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 relative">
                  {relations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRelations(relations.filter((r) => r.id !== rel.id))}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      title="Remove relationship"
                    >
                      ✕
                    </button>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="label">Berhubungan dengan</label>
                      <select
                        className="input"
                        value={rel.relatedToId}
                        onChange={(e) => {
                          const newRel = [...relations];
                          newRel[index].relatedToId = e.target.value;
                          if (!e.target.value) newRel[index].relationType = '';
                          setRelations(newRel);
                        }}
                      >
                        <option value="">— Tidak ada —</option>
                        {existingMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                    </div>

                    {rel.relatedToId && (
                      <div className="space-y-3">
                        <div>
                          <label className="label">Orang baru ini adalah … dari {existingMembers.find(m => m.id === rel.relatedToId)?.full_name}</label>
                          <select
                            className="input"
                            value={rel.relationType}
                            onChange={(e) => {
                              const newRel = [...relations];
                              newRel[index].relationType = e.target.value;
                              setRelations(newRel);
                            }}
                          >
                            <option value="">Pilih hubungan</option>
                            <option value="child">Anak</option>
                            <option value="parent">Orang Tua</option>
                            <option value="spouse">Pasangan</option>
                            <option value="sibling">Saudara Kandung</option>
                          </select>
                          {errors[`relationType_${index}`] && <p className="error-msg">{errors[`relationType_${index}`]}</p>}
                        </div>
                        {rel.relationType && (
                          <div>
                            <label className="label">Catatan Hubungan <span className="normal-case font-normal text-slate-600">(opsional)</span></label>
                            <input
                              type="text"
                              className="input"
                              placeholder='contoh: "Angkat", "Tiri", "Saudara seayah"'
                              value={rel.relationNote}
                              onChange={(e) => {
                                const newRel = [...relations];
                                newRel[index].relationNote = e.target.value;
                                setRelations(newRel);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Link to registered user (optional) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Hubungkan ke Pengguna Terdaftar <span className="font-normal normal-case text-slate-600">(opsional)</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Jika orang ini sudah punya akun, hubungkan agar mereka bisa mengelola profilnya sendiri.</p>
            <div>
              <label className="label">Cari berdasarkan email</label>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Mencari…
              </p>
            )}
            {linkedUser && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-900/20 border border-green-800">
                <div>
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">{linkedUser.full_name || 'Pengguna terdaftar'}</p>
                  <p className="text-green-600 text-xs">{userEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setLinkedUser(null); setUserEmail(''); }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
            )}
            {userNotFound && userEmail.includes('@') && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Tidak ditemukan pengguna terdaftar dengan email tersebut. Anggota akan ditambahkan sebagai catatan tidak terdaftar.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button id="saveMemberBtn" type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Menyimpan…' : 'Tambah Anggota'}
            </button>
            <button type="button" onClick={() => navigate(`/trees/${treeId}`)} className="btn-secondary">
              Batal
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
