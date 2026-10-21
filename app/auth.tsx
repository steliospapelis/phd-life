import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AuthInput } from "@/src/features/auth/components/AuthInput";
import { AuthPrimaryButton } from "@/src/features/auth/components/AuthPrimaryButton";
import { AuthScreenLayout } from "@/src/features/auth/components/AuthScreenLayout";
import { PhdLifeLogo } from "@/src/features/auth/components/PhdLifeLogo";
import { AUTH_MESSAGES, type FriendlyAuthError, getAuthErrorMessage } from "@/src/features/auth/getFriendlyAuthError";
import { authColors, authCopy } from "@/src/config/auth";
import { isSupabaseConfigured } from "@/src/config/app";
import { AUTH_CONFIG, isSensibleEmail, normalizeEmail, validateLogin, validateSignup, type AuthFieldErrors } from "@/src/features/auth/validation";
import { withAuthTimeout } from "@/src/features/auth/withAuthTimeout";
import { useAuth } from "@/src/hooks/useAuth";

type AuthMode = "login" | "register" | "forgot";
type Operation = "signing-in" | "signing-up" | "forgot-password" | "resending";
type FeedbackState = FriendlyAuthError & { success?: boolean };

export default function AuthScreen() {
  const { ready, sessionExists, signIn, signUp, resetPassword, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const inFlight = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (ready && sessionExists && !verificationEmail) router.replace("/");
  }, [ready, sessionExists, verificationEmail]);

  const busy = operation !== null;

  function showFeedback(message: string, options: Partial<FeedbackState> = {}) {
    setFeedback({ message, ...options });
  }

  function clearFieldError(field: keyof AuthFieldErrors) {
    setFieldErrors((current) => current[field] ? { ...current, [field]: undefined } : current);
    setFeedback((current) => current && !current.success ? null : current);
  }

  function focusFirstInvalid(errors: AuthFieldErrors) {
    const first = errors.email ? emailRef : errors.password ? passwordRef : confirmRef;
    setTimeout(() => first.current?.focus(), 0);
  }

  function changeMode(nextMode: AuthMode) {
    setFeedback(null);
    setFieldErrors({});
    setMode(nextMode);
  }

  async function submit() {
    if (inFlight.current || (mode !== "login" && mode !== "register")) return;
    const normalizedEmail = normalizeEmail(email);
    const errors = mode === "login" ? validateLogin(normalizedEmail, password) : validateSignup(normalizedEmail, password, confirm);
    setEmail(normalizedEmail);
    setFieldErrors(errors);
    setFeedback(null);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }

    inFlight.current = true;
    setOperation(mode === "login" ? "signing-in" : "signing-up");
    try {
      const result = mode === "login" ? await withAuthTimeout(signIn(normalizedEmail, password)) : await withAuthTimeout(signUp(normalizedEmail, password));
      if (result.accountExists) setFeedback({ message: AUTH_MESSAGES.accountAlreadyExists, action: "sign-in" });
      else if (result.needsVerification) setVerificationEmail(normalizedEmail);
      else router.replace("/");
    } catch (error) {
      const mapped = getAuthErrorMessage(error, mode === "login" ? "login" : "signup");
      if (mapped.field) setFieldErrors((current) => ({ ...current, [mapped.field as keyof AuthFieldErrors]: mapped.message }));
      if (!mapped.field || mapped.action) setFeedback(mapped);
    } finally {
      inFlight.current = false;
      setOperation(null);
    }
  }

  async function forgot() {
    if (inFlight.current) return;
    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);
    if (!normalizedEmail) {
      setFieldErrors({ email: "Enter your email." });
      emailRef.current?.focus();
      return;
    }
    if (!isSensibleEmail(normalizedEmail)) {
      setFieldErrors({ email: "Enter a valid email address." });
      emailRef.current?.focus();
      return;
    }
    setFieldErrors({});
    setFeedback(null);
    inFlight.current = true;
    setOperation("forgot-password");
    try {
      await withAuthTimeout(resetPassword(normalizedEmail));
      showFeedback("Reset link sent. Check your inbox.", { success: true });
    } catch (error) {
      const mapped = getAuthErrorMessage(error, "forgot-password");
      if (mapped.field) setFieldErrors({ [mapped.field]: mapped.message });
      if (!mapped.field) setFeedback(mapped);
    } finally {
      inFlight.current = false;
      setOperation(null);
    }
  }

  async function resend(emailToSend: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setOperation("resending");
    try {
      await withAuthTimeout(resendConfirmation(emailToSend));
      showFeedback(AUTH_MESSAGES.verificationSent, { success: true });
    } catch (error) {
      setFeedback(getAuthErrorMessage(error, "resend-confirmation"));
    } finally {
      inFlight.current = false;
      setOperation(null);
    }
  }

  if (!ready) {
    return <AuthScreenLayout><View style={styles.loading}><PhdLifeLogo size="small" /><ActivityIndicator color={authColors.green} /><Text style={styles.loadingText}>Loading…</Text></View></AuthScreenLayout>;
  }

  if (verificationEmail) {
    return <VerificationView email={verificationEmail} busy={operation === "resending"} feedback={feedback} onResend={() => void resend(verificationEmail)} onBack={() => { setVerificationEmail(null); changeMode("login"); }} />;
  }

  if (mode === "forgot") {
    return (
      <AuthScreenLayout>
        <View style={styles.forgotTop}><PhdLifeLogo size="large" /></View>
        <View style={styles.headingBlock}><Text style={styles.title}>{authCopy.forgot.title}</Text><Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>{authCopy.forgot.subtitle}</Text></View>
        <View style={styles.form}>
          <AuthInput ref={emailRef} label="Email" value={email} onChangeText={(value) => { setEmail(value); clearFieldError("email"); }} autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address" returnKeyType="go" onSubmitEditing={() => void forgot()} placeholder="you@university.edu" error={fieldErrors.email} />
          {feedback ? <Feedback feedback={feedback} /> : null}
          <AuthPrimaryButton label="Send reset email" loading={operation === "forgot-password"} loadingLabel="Sending…" onPress={() => void forgot()} disabled={busy} />
          <LinkButton label="Back to sign in" onPress={() => changeMode("login")} />
        </View>
      </AuthScreenLayout>
    );
  }

  const isRegister = mode === "register";
  return (
    <AuthScreenLayout>
      <View style={styles.brand}><PhdLifeLogo size="large" /></View>
      <View style={styles.headingBlock}>
        <Text style={[styles.title, isRegister && styles.signupTitle]} numberOfLines={1} adjustsFontSizeToFit>{isRegister ? authCopy.signup.title : authCopy.login.title}</Text>
        <Text style={[styles.subtitle, isRegister && styles.signupSubtitle]} numberOfLines={1} adjustsFontSizeToFit>{isRegister ? authCopy.signup.subtitle : authCopy.login.subtitle}</Text>
      </View>
      {!isSupabaseConfigured ? <Text style={styles.preview}>Preview mode · connect Supabase to enable accounts</Text> : null}
      <View style={styles.form}>
        <AuthInput ref={emailRef} label="Email" value={email} onChangeText={(value) => { setEmail(value); clearFieldError("email"); }} autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} placeholder="you@university.edu" error={fieldErrors.email} />
        <AuthInput ref={passwordRef} label="Password" value={password} onChangeText={(value) => { setPassword(value); clearFieldError("password"); }} autoCapitalize="none" autoCorrect={false} autoComplete={isRegister ? "new-password" : "password"} textContentType={isRegister ? "newPassword" : "password"} returnKeyType={isRegister ? "next" : "go"} onSubmitEditing={() => isRegister ? confirmRef.current?.focus() : void submit()} placeholder={`At least ${AUTH_CONFIG.minimumPasswordLength} characters`} secureTextEntry error={fieldErrors.password} />
        {isRegister ? <AuthInput ref={confirmRef} label="Confirm password" value={confirm} onChangeText={(value) => { setConfirm(value); clearFieldError("confirmPassword"); }} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={() => void submit()} placeholder="Repeat your password" secureTextEntry error={fieldErrors.confirmPassword} /> : null}
        {!isRegister ? <View style={styles.forgotRow}><LinkButton label="Forgot password?" onPress={() => changeMode("forgot")} /></View> : null}
        {feedback ? <Feedback feedback={feedback} /> : null}
        {feedback?.action === "resend-confirmation" ? <LinkButton label="Resend verification email" onPress={() => void resend(normalizeEmail(email))} disabled={busy} /> : null}
        {feedback?.action === "sign-in" ? <LinkButton label="Sign in" onPress={() => changeMode("login")} /> : null}
        <AuthPrimaryButton label={isRegister ? "Create account" : "Sign in"} loading={operation === "signing-in" || operation === "signing-up"} loadingLabel={isRegister ? "Creating account…" : "Signing in…"} onPress={() => void submit()} disabled={busy} />
      </View>
      <View style={styles.footer}><Text style={styles.footerCopy}>{isRegister ? "Already have an account?" : "New to PhD Life?"}</Text><LinkButton label={isRegister ? "Sign in" : "Create account"} onPress={() => changeMode(isRegister ? "login" : "register")} /></View>
    </AuthScreenLayout>
  );
}

function VerificationView({ email, busy, feedback, onResend, onBack }: { email: string; busy: boolean; feedback: FeedbackState | null; onResend: () => void; onBack: () => void }) {
  return <AuthScreenLayout><View style={styles.forgotTop}><PhdLifeLogo size="large" /></View><View style={styles.headingBlock}><Text style={styles.title}>Check your inbox</Text><Text style={styles.subtitle}>We sent a verification link to:</Text><Text style={styles.verificationEmail}>{email}</Text><Text style={styles.subtitle}>Verify your email to continue.</Text></View><View style={styles.form}>{feedback ? <Feedback feedback={feedback} /> : null}<AuthPrimaryButton label="Resend email" loading={busy} loadingLabel="Sending…" onPress={onResend} disabled={busy} /><LinkButton label="Back to sign in" onPress={onBack} /></View></AuthScreenLayout>;
}

function Feedback({ feedback }: { feedback: FeedbackState }) {
  return <View accessibilityRole="alert" style={[styles.feedback, feedback.success ? styles.feedbackSuccess : feedback.neutral ? styles.feedbackNeutral : styles.feedbackError]}><Text style={styles.feedbackText}>{feedback.message}</Text></View>;
}

function LinkButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.linkButton, disabled && styles.linkDisabled]}><Text style={styles.link}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: authColors.textSecondary, fontSize: 13 },
  brand: { alignItems: "center", paddingTop: 18, paddingBottom: 8 },
  headingBlock: { marginBottom: 14 },
  title: { color: authColors.navy, fontSize: 25, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { color: authColors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 5 },
  verificationEmail: { color: authColors.textPrimary, fontSize: 15, fontWeight: "700", marginTop: 9 },
  form: { gap: 12 },
  forgotRow: { alignItems: "flex-end", marginTop: -4 },
  linkButton: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  linkDisabled: { opacity: 0.5 },
  link: { color: authColors.green, fontSize: 13, fontWeight: "800" },
  footer: { alignItems: "center", marginTop: 10 },
  footerCopy: { color: authColors.textSecondary, fontSize: 13 },
  feedback: { borderRadius: 12, padding: 12 },
  feedbackSuccess: { backgroundColor: "#E7F0E5" },
  feedbackNeutral: { backgroundColor: "#EEE9DC" },
  feedbackError: { backgroundColor: "#F8E3DD" },
  feedbackText: { color: authColors.textPrimary, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  preview: { color: authColors.textSecondary, fontSize: 12, textAlign: "center", marginBottom: 14 },
  forgotTop: { alignItems: "center", paddingTop: 24, paddingBottom: 36 },
  signupSubtitle: { fontSize: 12, lineHeight: 16, marginTop: 3 },
  signupTitle: { fontSize: 20, lineHeight: 24 },
});
