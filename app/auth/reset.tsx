import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AuthInput } from "@/src/features/auth/components/AuthInput";
import { AuthPrimaryButton } from "@/src/features/auth/components/AuthPrimaryButton";
import { AuthScreenLayout } from "@/src/features/auth/components/AuthScreenLayout";
import { PhdLifeLogo } from "@/src/features/auth/components/PhdLifeLogo";
import { authColors } from "@/src/config/auth";
import { isSupabaseConfigured } from "@/src/config/app";
import { supabase } from "@/src/lib/supabase/client";

export default function PasswordResetScreen() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setChecking(false);
      return;
    }

    let mounted = true;
    const timer = setTimeout(() => { if (mounted) setChecking(false); }, 1500);
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setHasSession(true);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setHasSession(true);
    }).catch(() => undefined);

    return () => {
      mounted = false;
      clearTimeout(timer);
      void listener.subscription.unsubscribe();
    };
  }, []);

  async function savePassword() {
    if (!supabase || saving) return;
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
  }

  if (checking) {
    return <AuthScreenLayout><View style={styles.center}><PhdLifeLogo size="small" /><ActivityIndicator color={authColors.green} /><Text style={styles.muted}>Preparing your password reset…</Text></View></AuthScreenLayout>;
  }

  if (!hasSession) {
    return <AuthScreenLayout><View style={styles.center}><PhdLifeLogo size="small" /><Text style={styles.title}>This reset link has expired</Text><Text style={styles.muted}>Request a new password reset email and try again.</Text><Pressable style={styles.linkButton} onPress={() => router.replace("/auth")}><Text style={styles.link}>Back to sign in</Text></Pressable></View></AuthScreenLayout>;
  }

  if (success) {
    return <AuthScreenLayout><View style={styles.center}><PhdLifeLogo size="small" /><Text style={styles.title}>Password updated</Text><Text style={styles.muted}>Your new password is ready. You can continue into PhD Life.</Text><AuthPrimaryButton label="Continue" onPress={() => router.replace("/")} /></View></AuthScreenLayout>;
  }

  return (
    <AuthScreenLayout>
      <View style={styles.brand}><PhdLifeLogo size="large" /></View>
      <View style={styles.headingBlock}><Text style={styles.title}>Choose a new password</Text><Text style={styles.muted}>One small administrative task, mercifully without a committee.</Text></View>
      <View style={styles.form}>
        <AuthInput ref={passwordRef} label="New password" value={password} onChangeText={(value) => { setPassword(value); setError(null); }} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" secureTextEntry placeholder="At least 8 characters" error={error ?? undefined} />
        <AuthInput label="Confirm password" value={confirm} onChangeText={(value) => { setConfirm(value); setError(null); }} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" secureTextEntry placeholder="Repeat your password" />
        <AuthPrimaryButton label="Update password" loading={saving} loadingLabel="Updating…" onPress={() => void savePassword()} disabled={saving} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 20 },
  brand: { alignItems: "center", paddingTop: 25, paddingBottom: 30 },
  headingBlock: { marginBottom: 22 },
  title: { color: authColors.navy, fontSize: 25, fontWeight: "800", letterSpacing: -0.3, textAlign: "center" },
  muted: { color: authColors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  form: { gap: 14 },
  linkButton: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  link: { color: authColors.green, fontSize: 13, fontWeight: "800" },
});
