import { useEffect, useState } from "react";
import { isSupabaseConfigured, redirectUrl, resetRedirectUrl } from "@/src/config/app";
import { supabase } from "@/src/lib/supabase/client";
import { useAppStore } from "@/src/store/useAppStore";
import { isObfuscatedSignupUser } from "@/src/features/auth/validation";

export function useAuth() {
  const demoSession = useAppStore((state) => state.demoSession);
  const setDemoSession = useAppStore((state) => state.setDemoSession);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [sessionExists, setSessionExists] = useState(demoSession);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSessionExists(Boolean(data.session));
      setReady(true);
    }).catch(() => {
      if (mounted) setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { if (mounted) setSessionExists(Boolean(next)); });
    return () => { mounted = false; void listener.subscription.unsubscribe(); };
  }, []);
  return {
    ready,
    sessionExists: isSupabaseConfigured ? sessionExists : demoSession,
    async signIn(email: string, password: string) {
      if (!isSupabaseConfigured || !supabase) { setDemoSession(true); return { needsVerification: false, accountExists: false }; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { needsVerification: false, accountExists: false };
    },
    async signUp(email: string, password: string) {
      if (!isSupabaseConfigured || !supabase) { setDemoSession(true); return { needsVerification: false, accountExists: false }; }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
      if (error) throw error;
      const accountExists = isObfuscatedSignupUser(data.user, data.session);
      return { needsVerification: !data.session && !accountExists, accountExists };
    },
    async resetPassword(email: string) {
      if (!isSupabaseConfigured || !supabase) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl });
      if (error) throw error;
    },
    async resendConfirmation(email: string) {
      if (!isSupabaseConfigured || !supabase) return;
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUrl } });
      if (error) throw error;
    },
    async signOut() { if (isSupabaseConfigured && supabase) await supabase.auth.signOut(); setDemoSession(false); setSessionExists(false); },
  };
}
