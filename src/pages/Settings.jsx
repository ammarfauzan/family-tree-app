import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
  const {
    user,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    updateProfile,
    updateEmail,
    updatePassword,
    enrollMFA,
    listMFAFactors,
    unenrollMFA,
  } = useAuth();

  // Display name
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  // Password
  const [passwordForm, setPasswordForm] = useState({ newPw: '', confirmPw: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  // MFA
  const [mfaFactors, setMfaFactors] = useState([]);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaEnrollData, setMfaEnrollData] = useState(null); // { id, totp: { qr_code, secret } }
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState('');

  // Active session
  const [sessionCreated] = useState(new Date().toLocaleString());
  useEffect(() => {
    listMFAFactors()
      .then((d) => setMfaFactors(d?.totp || []))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveName(e) {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateProfile({ fullName: displayName });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function handleUpdateEmail(e) {
    e.preventDefault();
    if (!newEmail.includes('@')) { setEmailMsg('Enter a valid email'); return; }
    setSavingEmail(true);
    setEmailMsg('');
    try {
      await updateEmail(newEmail);
      setEmailMsg('✅ Confirmation sent to both email addresses. Check your inbox.');
      setNewEmail('');
    } catch (err) {
      setEmailMsg(err.message);
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (passwordForm.newPw.length < 8) { setPwMsg('Min 8 characters'); return; }
    if (passwordForm.newPw !== passwordForm.confirmPw) { setPwMsg("Passwords don't match"); return; }
    setSavingPw(true);
    setPwMsg('');
    try {
      await updatePassword(passwordForm.newPw);
      setPwMsg('✅ Password updated successfully.');
      setPasswordForm({ newPw: '', confirmPw: '' });
    } catch (err) {
      setPwMsg(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  async function handleEnrollMFA() {
    setMfaEnrolling(true);
    setMfaMsg('');
    try {
      const data = await enrollMFA();
      setMfaEnrollData(data);
    } catch (err) {
      setMfaMsg(err.message);
    } finally {
      setMfaEnrolling(false);
    }
  }

  async function handleVerifyMFA(e) {
    e.preventDefault();
    setMfaMsg('');
    if (!mfaEnrollData) return;
    try {
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: mfaEnrollData.id });
      await supabase.auth.mfa.verify({ factorId: mfaEnrollData.id, challengeId: challenge.id, code: mfaCode });
      setMfaMsg('✅ MFA enabled successfully!');
      setMfaEnrollData(null);
      setMfaCode('');
      const { data } = await supabase.auth.mfa.listFactors();
      setMfaFactors(data?.totp || []);
    } catch (err) {
      setMfaMsg(err.message);
    }
  }

  async function handleUnenrollMFA(factorId) {
    if (!window.confirm('Disable two-factor authentication?')) return;
    try {
      await unenrollMFA(factorId);
      setMfaFactors((prev) => prev.filter((f) => f.id !== factorId));
      setMfaMsg('✅ MFA disabled.');
    } catch (err) {
      setMfaMsg(err.message);
    }
  }

  const isOAuthUser = user?.app_metadata?.provider !== 'email';
  const connectedProviders = user?.app_metadata?.providers || [user?.app_metadata?.provider].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Account Settings</h1>
        <p className="text-slate-500 text-sm mb-8">Manage your profile, security, and sessions.</p>

        <div className="space-y-5">

          {/* ── Profile ── */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-white">Profile</h2>
            <p className="text-slate-500 text-xs">{user?.email}</p>
            <form onSubmit={handleSaveName} className="flex gap-3">
              <input
                id="settingsDisplayName"
                type="text"
                className="input flex-1"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <button type="submit" disabled={savingName} className="btn-primary px-4">
                {nameSaved ? '✓ Saved' : savingName ? '…' : 'Save'}
              </button>
            </form>
          </div>

          {/* ── Email ── */}
          {!isOAuthUser && (
            <div className="card space-y-4">
              <h2 className="text-base font-semibold text-white">Change Email</h2>
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <input
                  id="settingsNewEmail"
                  type="email"
                  className="input"
                  placeholder="New email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                {emailMsg && (
                  <p className={`text-xs ${emailMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {emailMsg}
                  </p>
                )}
                <button type="submit" disabled={savingEmail} className="btn-primary">
                  {savingEmail ? 'Sending…' : 'Update Email'}
                </button>
              </form>
            </div>
          )}

          {/* ── Password ── */}
          {!isOAuthUser && (
            <div className="card space-y-4">
              <h2 className="text-base font-semibold text-white">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <input
                  id="settingsNewPw"
                  type="password"
                  className="input"
                  placeholder="New password (min 8 chars)"
                  value={passwordForm.newPw}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPw: e.target.value }))}
                />
                <input
                  id="settingsConfirmPw"
                  type="password"
                  className="input"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPw}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPw: e.target.value }))}
                />
                {pwMsg && (
                  <p className={`text-xs ${pwMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {pwMsg}
                  </p>
                )}
                <button type="submit" disabled={savingPw} className="btn-primary">
                  {savingPw ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* ── Connected Accounts ── */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-white">Connected Accounts</h2>
            <div className="space-y-2">
              {connectedProviders.map((p) => (
                <div key={p} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-lg">{p === 'google' ? '🔵' : p === 'facebook' ? '🔷' : '📧'}</span>
                  <span className="text-slate-200 text-sm capitalize">{p}</span>
                  <span className="ml-auto badge bg-green-900/40 text-green-400 border border-green-800">Connected</span>
                </div>
              ))}
              {!connectedProviders.includes('google') && (
                <button onClick={signInWithGoogle} className="btn-secondary text-xs w-full">
                  + Link Google Account
                </button>
              )}
              {!connectedProviders.includes('facebook') && (
                <button onClick={signInWithFacebook} className="btn-secondary text-xs w-full">
                  + Link Facebook Account
                </button>
              )}
            </div>
          </div>

          {/* ── MFA ── */}
          <div className="card space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Two-Factor Authentication (TOTP)</h2>
              <p className="text-slate-500 text-xs mt-0.5">Add an extra layer of security using an authenticator app.</p>
            </div>

            {mfaMsg && (
              <p className={`text-xs ${mfaMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{mfaMsg}</p>
            )}

            {mfaFactors.length > 0 ? (
              <div className="space-y-2">
                {mfaFactors.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-green-900/20 border border-green-800">
                    <div>
                      <p className="text-green-300 text-sm font-medium">✅ TOTP Enabled</p>
                      <p className="text-green-700 text-xs">Factor ID: {f.id.slice(0, 8)}…</p>
                    </div>
                    <button onClick={() => handleUnenrollMFA(f.id)} className="btn-danger text-xs px-3 py-1.5">
                      Disable
                    </button>
                  </div>
                ))}
              </div>
            ) : mfaEnrollData ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
                <div className="bg-white p-3 rounded-xl w-fit mx-auto">
                  <img src={mfaEnrollData.totp.qr_code} alt="MFA QR Code" className="w-40 h-40" />
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs mb-1">Or enter this secret manually:</p>
                  <code className="text-slate-300 text-xs bg-slate-800 px-3 py-1 rounded-lg select-all">
                    {mfaEnrollData.totp.secret}
                  </code>
                </div>
                <form onSubmit={handleVerifyMFA} className="space-y-3">
                  <input
                    id="mfaVerifyCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input text-center text-xl tracking-widest font-mono"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Verify & Enable</button>
                    <button type="button" onClick={() => setMfaEnrollData(null)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                id="enableMfaBtn"
                onClick={handleEnrollMFA}
                disabled={mfaEnrolling}
                className="btn-secondary"
              >
                {mfaEnrolling ? 'Setting up…' : '🔐 Enable Two-Factor Auth'}
              </button>
            )}
          </div>

          {/* ── Sessions ── */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-white">Sessions</h2>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm">
              <p className="text-slate-300 font-medium">Current Session</p>
              <p className="text-slate-500 text-xs mt-0.5">Started: {sessionCreated}</p>
              <p className="text-slate-500 text-xs">Email: {user?.email}</p>
            </div>
            <button
              id="signOutAllBtn"
              onClick={() => signOut('global')}
              className="btn-danger text-sm"
            >
              Sign Out from All Devices
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
