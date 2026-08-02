import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useTree } from '../hooks/useTree';
import { supabase } from '../lib/supabaseClient';

export default function CreateTree() {
  const { createTree } = useTree();
  const navigate = useNavigate();

  const SYMBOLS = ['🌳', '🌲', '🌴', '🌺', '🌸', '🪴', '🌵', '🏡', '🕌', '🌙', '⭐', '🦅', '🦁', '🐉', '💎', '🏔️'];
  const [form, setForm] = useState({ name: '', description: '', privacy: 'family_only', symbol: '🌳' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tree name is required';
    return errs;
  }

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function removeCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadCover(treeId) {
    if (!coverFile) return null;
    setUploadProgress(true);
    const ext = coverFile.name.split('.').pop();
    const path = `${treeId}/cover.${ext}`;
    const { error } = await supabase.storage
      .from('tree-covers')
      .upload(path, coverFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('tree-covers').getPublicUrl(path);
    setUploadProgress(false);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setServerError('');
    try {
      const tree = await createTree(form);
      if (coverFile) {
        const photoUrl = await uploadCover(tree.id);
        if (photoUrl) {
          await supabase
            .from('family_trees')
            .update({ cover_photo: photoUrl })
            .eq('id', tree.id);
        }
      }
      navigate(`/trees/${tree.id}`);
    } catch (err) {
      setServerError(err.message || 'Failed to create tree.');
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  }

  function change(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Kembali ke Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 mb-1">Buat Pohon Baru</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Beri nama pohon keluargamu dan mulai sekarang.</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="card space-y-5">
          <div>
            <label className="label">Nama Pohon *</label>
            <input
              id="treeName"
              type="text"
              className="input"
              placeholder="contoh: Keluarga Besar Ramadhan"
              value={form.name}
              onChange={change('name')}
            />
            {errors.name && <p className="error-msg">{errors.name}</p>}
          </div>

          <div>
            <label className="label">Deskripsi</label>
            <textarea
              id="treeDescription"
              className="input min-h-[80px] resize-y"
              placeholder="Deskripsi singkat tentang pohon keluarga ini…"
              value={form.description}
              onChange={change('description')}
            />
          </div>

          {/* Symbol Picker */}
          <div>
            <label className="label">Simbol Pohon</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Pilih emoji untuk merepresentasikan pohon keluargamu</p>
            <div className="grid grid-cols-8 gap-2">
              {SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, symbol: sym }))}
                  className={`h-10 w-full rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${
                    form.symbol === sym
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 scale-110'
                      : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:scale-105'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
            <p className="text-center text-3xl mt-3">Terpilih: {form.symbol}</p>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="label">Foto Sampul</label>
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden h-36 bg-white dark:bg-slate-800">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/80 hover:bg-red-600 hover:text-white text-slate-700 dark:text-white rounded-lg px-2 py-1 text-xs transition-colors"
                >
                  ✕ Hapus
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-600 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors cursor-pointer"
              >
                <span className="text-2xl">🖼️</span>
                <span className="text-xs">Klik untuk upload foto sampul</span>
                <span className="text-xs text-slate-600">JPG, PNG or WebP</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              id="treeCoverPhoto"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          <div>
            <label className="label">Privasi</label>
            <select
              id="treePrivacy"
              className="input"
              value={form.privacy}
              onChange={change('privacy')}
            >
              <option value="public">Publik — Siapa saja bisa melihat</option>
              <option value="family_only">Keluarga — Hanya anggota yang diundang</option>
              <option value="private">Pribadi — Hanya kamu</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              id="createTreeBtn"
              type="submit"
              disabled={loading || uploadProgress}
              className="btn-primary flex-1"
            >
              {uploadProgress ? 'Mengupload foto…' : loading ? 'Membuat…' : 'Buat Pohon'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Batal
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
