import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { isSupabaseConfigured, redirectUrl } from "@/src/config/app";
import { supabase } from "@/src/lib/supabase/client";
import { useAppStore } from "@/src/store/useAppStore";
import { isObfuscatedSignupUser } from "@/src/features/auth/validation";

WebBrowser.maybeCompleteAuthSession();

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
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const accountExists = isObfuscatedSignupUser(data.user, data.session);
      return { needsVerification: !data.session && !accountExists, accountExists };
    },
    async resetPassword(email: string) {
      if (!isSupabaseConfigured || !supabase) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "phdlife://auth/reset" });
      if (error) throw error;
    },
    async resendConfirmation(email: string) {
      if (!isSupabaseConfigured || !supabase) return;
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
    },
    async google() {
      if (!isSupabaseConfigured || !supabase) { setDemoSession(true); return { status: "success" as const }; }
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectUrl, skipBrowserRedirect: true } });
      if (error) throw error;
      if (!data.url) throw new Error("Google sign-in did not return an authorization URL.");
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type !== "success") return { status: "cancelled" as const };
      const parsed = Linking.parse(result.url);
      const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
      if (!code) throw new Error("Google sign-in callback did not include an authorization code.");
      const exchange = await supabase.auth.exchangeCodeForSession(code);
      if (exchange.error) throw exchange.error;
      return { status: "success" as const };
    },
    async signOut() { if (isSupabaseConfigured && supabase) await supabase.auth.signOut(); setDemoSession(false); setSessionExists(false); },
  };
}
