import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useMembers } from '../hooks/useMembers';
import { useGallery } from '../hooks/useGallery';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@username', icon: '📸' },
  { key: 'facebook', label: 'Facebook', placeholder: 'profile URL or name', icon: '👤' },
  { key: 'twitter', label: 'X / Twitter', placeholder: '@username', icon: '🐦' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'profile URL', icon: '💼' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+62 8xx xxxx', icon: '💬' },
];

export default function EditMember() {
  const { treeId, memberId } = useParams();
  const navigate = useNavigate();
  const { getMember, updateMember, getMembers, addRelationship, removeRelationship } = useMembers();
  const { uploadProfilePhoto } = useGallery();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Relationships
  const [existingMembers, setExistingMembers] = useState([]);
  const [existingRelationships, setExistingRelationships] = useState([]);
  const [newRelation, setNewRelation] = useState({ relatedToId: '', relationType: '', relationNote: '' });
  const [relationSaving, setRelationSaving] = useState(false);

  // Profile photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // Social links (editable per platform)
  const [socials, setSocials] = useState({});

  // Interests (comma-separated)
  const [interestsText, setInterestsText] = useState('');
  useEffect(() => {
    getMember(memberId).then((m) => {
      setForm({
        full_name: m.full_name || '',
        nickname: m.nickname || '',
        gender: m.gender || 'unknown',
        birth_date: m.birth_date || '',
        birth_place: m.birth_place || '',
        death_date: m.death_date || '',
        is_deceased: m.is_deceased || false,
        address: m.address || '',
        phone: m.phone || '',
        email: m.email || '',
        occupation: m.occupation || '',
        education: m.education || '',
        biography: m.biography || '',
        religion: m.religion || '',
        nationality: m.nationality || '',
        custom_notes: m.custom_notes || '',
        profile_photo: m.profile_photo || '',
      });
      setSocials(m.social_links || {});
      setInterestsText((m.interests || []).join(', '));
      setPhotoPreview(m.profile_photo || null);
      setExistingRelationships(m.relationships || []);
    }).catch(console.error);

    getMembers(treeId).then((members) => {
      setExistingMembers(members.filter((m) => m.id !== memberId));
    }).catch(console.error).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    return errs;
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    setServerError('');
    try {
      let profile_photo = form.profile_photo;

      // Upload new profile photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        profile_photo = await uploadProfilePhoto(memberId, photoFile);
        setUploadingPhoto(false);
      }

      // Parse interests
      const interests = interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateMember(memberId, {
        ...form,
        birth_date: form.birth_date || null,
        death_date: form.death_date || null,
        profile_photo,
        social_links: socials,
        interests,
      });
      navigate(`/trees/${treeId}/members/${memberId}`);
    } catch (err) {
      setServerError(err.message || 'Failed to update member.');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  }

  function change(field) {
    return (e) => setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  async function handleAddRelation() {
    if (!newRelation.relatedToId || !newRelation.relationType) return;
    setRelationSaving(true);
    try {
      await addRelationship(treeId, memberId, newRelation.relatedToId, newRelation.relationType, newRelation.relationNote);
      const m = await getMember(memberId);
      setExistingRelationships(m.relationships || []);
      setNewRelation({ relatedToId: '', relationType: '', relationNote: '' });
    } catch (err) {
      alert('Failed to add relationship: ' + err.message);
    } finally {
      setRelationSaving(false);
    }
  }

  async function handleRemoveRelation(rel) {
    if (!confirm('Are you sure you want to remove this relationship?')) return;
    setRelationSaving(true);
    try {
      await removeRelationship(rel.person_a_id, rel.person_b_id);
      setExistingRelationships(existingRelationships.filter((r) => r.id !== rel.id));
    } catch (err) {
      alert('Failed to remove relationship: ' + err.message);
    } finally {
      setRelationSaving(false);
    }
  }

  const initials = form?.full_name
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-10">
        <Link to={`/trees/${treeId}/members/${memberId}`}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Back to Profile
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 mb-1">Edit Member</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Update this person's information.</p>

        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {serverError}
          </div>
        )}

        {form && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* ── Profile Photo ── */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Profile Photo</h2>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-300 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-brand-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl">
                      {initials}
                    </div>
                  )}
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); setForm(f => ({ ...f, profile_photo: '' })); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-slate-900 dark:text-white rounded-full text-xs flex items-center justify-center leading-none hover:bg-red-500"
                    >×</button>
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="btn-secondary text-xs"
                  >
                    {photoPreview ? '🔄 Change Photo' : '📷 Upload Photo'}
                  </button>
                  <p className="text-slate-600 text-xs mt-1.5">JPG, PNG or WebP</p>
                </div>
                <input ref={photoInputRef} id="profilePhotoInput" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
            </div>

            {/* ── Basic Info ── */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Basic Info</h2>
              <div>
                <label className="label">Full Name *</label>
                <input id="editFullName" type="text" className="input" value={form.full_name} onChange={change('full_name')} />
                {errors.full_name && <p className="error-msg">{errors.full_name}</p>}
              </div>
              <div>
                <label className="label">Nickname</label>
                <input id="editNickname" type="text" className="input" placeholder="Optional" value={form.nickname} onChange={change('nickname')} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select id="editGender" className="input" value={form.gender} onChange={change('gender')}>
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth</label>
                  <input id="editBirthDate" type="date" className="input" value={form.birth_date} onChange={change('birth_date')} />
                </div>
                <div>
                  <label className="label">Place of Birth</label>
                  <input id="editBirthPlace" type="text" className="input" value={form.birth_place} onChange={change('birth_place')} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input id="editIsDeceased" type="checkbox" className="w-4 h-4 accent-brand-500"
                  checked={form.is_deceased} onChange={change('is_deceased')} />
                <label htmlFor="editIsDeceased" className="text-slate-600 dark:text-slate-400 text-sm select-none cursor-pointer">
                  Mark as deceased
                </label>
              </div>
              {form.is_deceased && (
                <div>
                  <label className="label">Date of Death</label>
                  <input id="editDeathDate" type="date" className="input" value={form.death_date} onChange={change('death_date')} />
                </div>
              )}
            </div>

            {/* ── Contact ── */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Contact & Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input id="editEmail" type="email" className="input" value={form.email} onChange={change('email')} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input id="editPhone" type="tel" className="input" value={form.phone} onChange={change('phone')} />
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input id="editAddress" type="text" className="input" value={form.address} onChange={change('address')} />
              </div>
            </div>

            {/* ── Personal Background ── */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Personal Background</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Occupation</label>
                  <input id="editOccupation" type="text" className="input" value={form.occupation} onChange={change('occupation')} />
                </div>
                <div>
                  <label className="label">Education</label>
                  <input id="editEducation" type="text" className="input" value={form.education} onChange={change('education')} />
                </div>
                <div>
                  <label className="label">Nationality</label>
                  <input id="editNationality" type="text" className="input" value={form.nationality} onChange={change('nationality')} />
                </div>
                <div>
                  <label className="label">Religion</label>
                  <input id="editReligion" type="text" className="input" value={form.religion} onChange={change('religion')} />
                </div>
              </div>
              <div>
                <label className="label">Interests / Hobbies <span className="text-slate-600 font-normal normal-case">(comma-separated)</span></label>
                <input
                  id="editInterests"
                  type="text"
                  className="input"
                  placeholder='e.g. Reading, Football, Cooking'
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Biography / Life Story</label>
                <textarea id="editBiography" className="input min-h-[100px] resize-y"
                  placeholder="Share their life story…" value={form.biography} onChange={change('biography')} />
              </div>
              <div>
                <label className="label">Custom Notes</label>
                <textarea id="editCustomNotes" className="input min-h-[70px] resize-y"
                  placeholder="Any other notes…" value={form.custom_notes} onChange={change('custom_notes')} />
              </div>
            </div>

            {/* ── Relationships ── */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Relationships</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage relationships for this person.</p>

              {existingRelationships.length > 0 && (
                <div className="space-y-2 mb-4">
                  {existingRelationships.map((rel) => {
                    const relatedPerson = existingMembers.find(m => m.id === rel.person_b_id);
                    if (!relatedPerson) return null;
                    return (
                      <div key={rel.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                            {rel.relation_type} <span className="font-normal text-slate-500">of</span> {relatedPerson.full_name}
                          </p>
                          {rel.relation_note && <p className="text-xs text-slate-500">{rel.relation_note}</p>}
                        </div>
                        <button
                          type="button"
                          disabled={relationSaving}
                          onClick={() => handleRemoveRelation(rel)}
                          className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add New Relationship</h3>
                <div>
                  <label className="label">Related to</label>
                  <select
                    className="input"
                    value={newRelation.relatedToId}
                    onChange={(e) => setNewRelation({ ...newRelation, relatedToId: e.target.value })}
                  >
                    <option value="">— None —</option>
                    {existingMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
                {newRelation.relatedToId && (
                  <>
                    <div>
                      <label className="label">Is a … of {existingMembers.find(m => m.id === newRelation.relatedToId)?.full_name}</label>
                      <select
                        className="input"
                        value={newRelation.relationType}
                        onChange={(e) => setNewRelation({ ...newRelation, relationType: e.target.value })}
                      >
                        <option value="">Select relationship</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="spouse">Spouse / Partner</option>
                        <option value="sibling">Sibling</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Note <span className="normal-case font-normal text-slate-500">(optional)</span></label>
                      <input
                        type="text"
                        className="input"
                        value={newRelation.relationNote}
                        onChange={(e) => setNewRelation({ ...newRelation, relationNote: e.target.value })}
                        placeholder='e.g. "Adopted"'
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!newRelation.relationType || relationSaving}
                      onClick={handleAddRelation}
                      className="btn-secondary w-full text-xs"
                    >
                      {relationSaving ? 'Adding…' : '+ Add Relationship'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Social Links ── */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Social Media</h2>
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.key}>
                  <label className="label">
                    {p.icon} {p.label}
                  </label>
                  <input
                    id={`social_${p.key}`}
                    type="text"
                    className="input"
                    placeholder={p.placeholder}
                    value={socials[p.key] || ''}
                    onChange={(e) => setSocials((s) => ({ ...s, [p.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button id="saveMemberEditBtn" type="submit" disabled={saving || uploadingPhoto} className="btn-primary flex-1">
                {uploadingPhoto ? 'Uploading photo…' : saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate(`/trees/${treeId}/members/${memberId}`)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
