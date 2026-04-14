/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Email / Password ──────────────────────────────────────
  async function signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password, remember }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password,
      options: { persistSession: remember },
    });
    if (error) throw error;
    return data;
  }

  async function signOut(scope = 'local') {
    const { error } = await supabase.auth.signOut({ scope });
    if (error) throw error;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });
    if (error) throw error;
  }

  // ── OAuth ─────────────────────────────────────────────────
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  async function signInWithFacebook() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  // ── Magic Link (AUTH-P4-05) ───────────────────────────────
  async function signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  // ── MFA (AUTH-P4-04) ──────────────────────────────────────
  async function enrollMFA() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return data; // { id, type, totp: { qr_code, secret, uri } }
  }

  async function listMFAFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data;
  }

  async function challengeMFA(factorId) {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw error;
    return data;
  }

  async function verifyMFA({ factorId, challengeId, code }) {
    const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) throw error;
    return data;
  }

  async function unenrollMFA(factorId) {
    const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    return data;
  }

  // ── Profile update ────────────────────────────────────────
  async function updateProfile({ fullName, avatarUrl }) {
    const updates = {};
    if (fullName !== undefined) updates.data = { full_name: fullName };
    if (avatarUrl !== undefined) updates.data = { ...(updates.data || {}), avatar_url: avatarUrl };
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  }

  async function updateEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      signUp, signIn, signOut, resetPassword,
      signInWithGoogle, signInWithFacebook, signInWithMagicLink,
      enrollMFA, listMFAFactors, challengeMFA, verifyMFA, unenrollMFA,
      updateProfile, updateEmail, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
