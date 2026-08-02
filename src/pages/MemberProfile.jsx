import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { useMembers } from '../hooks/useMembers';
import { useGallery } from '../hooks/useGallery';
import { useAuth } from '../hooks/useAuth';

const SOCIAL_ICONS = {
  instagram: { icon: '📸', label: 'Instagram', base: 'https://instagram.com/' },
  facebook: { icon: '👤', label: 'Facebook', base: '' },
  twitter: { icon: '🐦', label: 'X / Twitter', base: 'https://twitter.com/' },
  linkedin: { icon: '💼', label: 'LinkedIn', base: '' },
  whatsapp: { icon: '💬', label: 'WhatsApp', base: 'https://wa.me/' },
};

function ProfileSkeleton() {
  return (
    <div className="space-y-5 page-enter">
      <div className="card flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 skeleton" />
          <div className="h-4 w-32 skeleton" />
          <div className="h-4 w-40 skeleton" />
        </div>
      </div>
      <div className="card space-y-4">
        <div className="h-4 w-32 skeleton" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 skeleton" />
          <div className="h-10 skeleton" />
          <div className="h-10 skeleton" />
          <div className="h-10 skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function MemberProfile() {
  const { treeId, memberId } = useParams();
  const navigate = useNavigate();
  const { getMember, deleteMember } = useMembers();
  const { listPhotos, uploadPhoto, deletePhoto } = useGallery();
  const { user } = useAuth();
  const toast = useToast();

  const [member, setMember] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete member modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delete photo modal
  const [photoToDelete, setPhotoToDelete] = useState(null);

  // Gallery upload state
  const [uploading, setUploading] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getMember(memberId),
      listPhotos(memberId),
    ])
      .then(([m, g]) => { setMember(m); setGallery(g); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteMember(memberId);
      toast.success(`${member.full_name} berhasil dihapus dari pohon.`);
      navigate(`/trees/${treeId}`);
    } catch (e) {
      toast.error(e.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleGalleryUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const newPhoto = await uploadPhoto(memberId, file, captionInput);
      setGallery((prev) => [newPhoto, ...prev]);
      setCaptionInput('');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      toast.success('Foto berhasil diupload!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhotoConfirm() {
    if (!photoToDelete) return;
    try {
      await deletePhoto(photoToDelete);
      setGallery((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      if (lightbox?.id === photoToDelete.id) setLightbox(null);
      toast.success('Foto berhasil dihapus.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPhotoToDelete(null);
    }
  }

  function Field({ label, value }) {
    if (!value) return null;
    return (
      <div>
        <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</dt>
        <dd className="text-slate-800 dark:text-slate-200 text-sm mt-0.5">{value}</dd>
      </div>
    );
  }

  const socialLinks = member?.social_links || {};
  const hasSocials = Object.values(socialLinks).some(Boolean);
  const interests = member?.interests || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <Link to={`/trees/${treeId}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Pohon
          </Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-white font-medium truncate">
            {member?.full_name || 'Memuat…'}
          </span>
        </nav>

        {loading && <ProfileSkeleton />}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm mt-4">{error}</div>
        )}

        {member && (
          <div className="page-enter">
            {/* ── Hero ── */}
            <div className="card flex flex-col sm:flex-row gap-6 items-start mb-5">
              <div className="flex-shrink-0">
                <img
                  src={member.profile_photo || `https://api.dicebear.com/8.x/lorelei/svg?seed=${encodeURIComponent(member.full_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                  alt={member.full_name}
                  className={`w-24 h-24 rounded-2xl object-cover ring-2 ring-brand-200 dark:ring-brand-800 bg-slate-100 dark:bg-slate-700 ${member.is_deceased ? 'grayscale opacity-80' : ''}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{member.full_name}</h1>
                  {member.is_deceased && (
                    <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 mt-1">🕊️ Almarhum</span>
                  )}
                </div>
                {member.nickname && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm italic mt-0.5">"{member.nickname}"</p>
                )}
                {member.occupation && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">💼 {member.occupation}</p>
                )}
                {/* Interests chips */}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {interests.map((i) => (
                      <span key={i} className="badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs">
                        {i}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Personal Details ── */}
            <div className="card mb-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Detail Pribadi</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Jenis Kelamin" value={member.gender !== 'unknown' ? member.gender : null} />
                <Field label="Tanggal Lahir" value={member.birth_date} />
                <Field label="Tempat Lahir" value={member.birth_place} />
                <Field label="Tanggal Wafat" value={member.death_date} />
                <Field label="Kewarganegaraan" value={member.nationality} />
                <Field label="Agama" value={member.religion} />
                <Field label="Email" value={member.email} />
                <Field label="Telepon" value={member.phone} />
                <Field label="Alamat" value={member.address} />
                <Field label="Pendidikan" value={member.education} />
              </dl>
            </div>

            {/* ── Biography ── */}
            {member.biography && (
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Biografi</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{member.biography}</p>
              </div>
            )}

            {/* ── Custom Notes ── */}
            {member.custom_notes && (
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Catatan</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{member.custom_notes}</p>
              </div>
            )}

            {/* ── Social Links ── */}
            {hasSocials && (
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Media Sosial</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(socialLinks)
                    .filter(([, val]) => val)
                    .map(([key, val]) => {
                      const meta = SOCIAL_ICONS[key] || { icon: '🔗', label: key };
                      const href = meta.base ? `${meta.base}${val.replace('@', '')}` : val;
                      return (
                        <a
                          key={key}
                          href={href.startsWith('http') ? href : `https://${href}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm transition-all"
                        >
                          <span>{meta.icon}</span>
                          <span>{val}</span>
                        </a>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Photo Gallery ── */}
            <div className="card mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Galeri Foto
                  {gallery.length > 0 && (
                    <span className="ml-2 text-slate-500 font-normal">({gallery.length})</span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {uploading ? 'Mengupload…' : '+ Tambah Foto'}
                </button>
              </div>

              {/* Caption input */}
              <div className="mb-3">
                <input
                  id="galleryCaptionInput"
                  type="text"
                  className="input text-sm"
                  placeholder="Caption untuk foto berikutnya (opsional)…"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                />
              </div>
              <input
                ref={galleryInputRef}
                id="galleryFileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
              />

              {gallery.length === 0 ? (
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-600 rounded-xl cursor-pointer text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-xs">Klik untuk menambahkan foto pertama</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {gallery.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800"
                      onClick={() => setLightbox(photo)}
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || ''}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {photo.uploaded_by === user?.id && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 dark:bg-slate-900/80 hover:bg-red-600 hover:text-white text-slate-700 dark:text-white rounded-lg text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3">
              <button
                id="editMemberBtn"
                onClick={() => navigate(`/trees/${treeId}/members/${memberId}/edit`)}
                className="btn-secondary flex-1"
              >
                ✏️ Edit Profil
              </button>
              <button
                id="deleteMemberBtn"
                onClick={() => setShowDeleteModal(true)}
                className="btn-danger"
              >
                Hapus
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 modal-overlay"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.photo_url}
              alt={lightbox.caption || ''}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            {lightbox.caption && (
              <p className="text-slate-300 text-sm text-center mt-3">{lightbox.caption}</p>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-lg transition-colors backdrop-blur-sm"
            >×</button>
          </div>
        </div>
      )}

      {/* Delete member modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Hapus Anggota?"
        message={`Apakah kamu yakin ingin menghapus ${member?.full_name} dari pohon ini? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Delete photo modal */}
      <ConfirmModal
        open={!!photoToDelete}
        title="Hapus Foto?"
        message="Apakah kamu yakin ingin menghapus foto ini?"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeletePhotoConfirm}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  );
}
