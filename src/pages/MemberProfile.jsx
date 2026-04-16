import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
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

export default function MemberProfile() {
  const { treeId, memberId } = useParams();
  const navigate = useNavigate();
  const { getMember, deleteMember } = useMembers();
  const { listPhotos, uploadPhoto, deletePhoto } = useGallery();
  const { user } = useAuth();

  const [member, setMember] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Gallery upload state
  const [uploading, setUploading] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [lightbox, setLightbox] = useState(null); // photo object or null
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

  async function handleDelete() {
    if (!window.confirm(`Remove ${member.full_name} from the tree? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteMember(memberId);
      navigate(`/trees/${treeId}`);
    } catch (e) {
      alert(e.message);
      setDeleting(false);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photo) {
    if (!window.confirm('Remove this photo?')) return;
    try {
      await deletePhoto(photo);
      setGallery((prev) => prev.filter((p) => p.id !== photo.id));
      if (lightbox?.id === photo.id) setLightbox(null);
    } catch (err) {
      alert(err.message);
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
        <Link to={`/trees/${treeId}`} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Back to Tree
        </Link>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm mt-4">{error}</div>
        )}

        {member && (
          <>
            {/* ── Hero ── */}
            <div className="card flex flex-col sm:flex-row gap-6 items-start mb-5">
              <div className="flex-shrink-0">
                {member.profile_photo ? (
                  <img src={member.profile_photo} alt={member.full_name}
                    className={`w-24 h-24 rounded-2xl object-cover ring-2 ring-slate-300 dark:ring-slate-700 ${member.is_deceased ? 'grayscale opacity-80' : ''}`} />
                ) : (
                  <img
                    src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${encodeURIComponent(member.full_name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt={member.full_name}
                    className={`w-24 h-24 rounded-2xl object-cover ring-2 ring-slate-300 dark:ring-slate-700 bg-slate-100 dark:bg-slate-700 ${member.is_deceased ? 'grayscale opacity-80' : ''}`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{member.full_name}</h1>
                  {member.is_deceased && (
                    <span className="badge bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-400 dark:border-slate-600 mt-1">† Deceased</span>
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
                      <span key={i} className="badge bg-brand-900/40 text-brand-300 border border-brand-800 text-xs">
                        {i}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Personal Details ── */}
            <div className="card mb-5">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Personal Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Gender" value={member.gender !== 'unknown' ? member.gender : null} />
                <Field label="Date of Birth" value={member.birth_date} />
                <Field label="Place of Birth" value={member.birth_place} />
                <Field label="Date of Death" value={member.death_date} />
                <Field label="Nationality" value={member.nationality} />
                <Field label="Religion" value={member.religion} />
                <Field label="Email" value={member.email} />
                <Field label="Phone" value={member.phone} />
                <Field label="Address" value={member.address} />
                <Field label="Education" value={member.education} />
              </dl>
            </div>

            {/* ── Biography ── */}
            {member.biography && (
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Biography</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{member.biography}</p>
              </div>
            )}

            {/* ── Custom Notes ── */}
            {member.custom_notes && (
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Notes</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{member.custom_notes}</p>
              </div>
            )}

            {/* ── Social Links ── */}
            {hasSocials && (
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Social Media</h2>
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
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-brand-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white text-sm transition-all"
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
                  Photo Gallery
                  {gallery.length > 0 && (
                    <span className="ml-2 text-slate-600 font-normal">({gallery.length})</span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {uploading ? 'Uploading…' : '+ Add Photo'}
                </button>
              </div>

              {/* Caption input (shown before choosing file) */}
              <div className="mb-3">
                <input
                  id="galleryCaptionInput"
                  type="text"
                  className="input text-sm"
                  placeholder="Optional caption for next photo…"
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
                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-600 rounded-xl cursor-pointer text-slate-500 dark:text-slate-400 hover:text-brand-400 transition-colors"
                >
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-xs">Click to add the first photo</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square bg-white dark:bg-slate-800"
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
                          onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-100 dark:bg-slate-900/80 hover:bg-red-700 text-slate-900 dark:text-white rounded-lg text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                ✏️ Edit Profile
              </button>
              <button
                id="deleteMemberBtn"
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.photo_url}
              alt={lightbox.caption || ''}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            {lightbox.caption && (
              <p className="text-slate-700 dark:text-slate-300 text-sm text-center mt-3">{lightbox.caption}</p>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-slate-100 dark:bg-slate-900/80 hover:bg-red-900 text-slate-900 dark:text-white rounded-full flex items-center justify-center text-lg transition-colors"
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}
