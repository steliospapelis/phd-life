import { Redirect } from "expo-router";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useAppStore } from "@/src/store/useAppStore";
import { APP_NAME, isSupabaseConfigured } from "@/src/config/app";
import { colors } from "@/src/config/theme";
import { authAssets } from "@/src/config/authAssets";
import { loadRemoteOnboardingComplete } from "@/src/services/contentService";

export default function Index() {
  const { ready, sessionExists } = useAuth(); const localOnboarded = useAppStore((state) => state.profile.onboardingComplete); const [remoteOnboarded, setRemoteOnboarded] = useState<boolean | null>(null);
  useEffect(() => { if (!isSupabaseConfigured || !sessionExists) return; void loadRemoteOnboardingComplete().then(setRemoteOnboarded).catch(() => setRemoteOnboarded(false)); }, [sessionExists]);
  if (!ready) return <View style={styles.splash}><Image source={authAssets.logo} resizeMode="contain" style={styles.logoImage} accessibilityLabel={`${APP_NAME} logo`} /><ActivityIndicator color={colors.coral} /></View>;
  if (!sessionExists) return <Redirect href="/auth" />;
  if (isSupabaseConfigured && remoteOnboarded === null) return <View style={styles.splash}><ActivityIndicator color={colors.coral} /></View>;
  return <Redirect href={(isSupabaseConfigured ? remoteOnboarded : localOnboarded) ? "/(tabs)/home" : "/onboarding"} />;
}
const styles = StyleSheet.create({ splash: { flex: 1, backgroundColor: colors.paper, justifyContent: "center", alignItems: "center", gap: 12 }, logoImage: { width: 180, height: 150 } });
