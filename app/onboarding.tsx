import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/src/components/ui/Screen";
import { Button } from "@/src/components/ui/Button";
import { Chip } from "@/src/components/ui/Chip";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { AvatarAssetPicker } from "@/src/components/avatar/AvatarAssetPicker";
import { defaultAvatar } from "@/src/lib/demo/data";
import { validateUsername } from "@/src/domain/username";
import { colors, spacing, typography } from "@/src/config/theme";
import type { AvatarConfig } from "@/src/types/models";
import { useAppStore } from "@/src/store/useAppStore";
import { isSupabaseConfigured } from "@/src/config/app";
import { initializePhdSurvivalRemote, isUsernameAvailableRemote, updateProfileRemote } from "@/src/services/gameService";

export default function Onboarding() {
  const complete = useAppStore((state) => state.completeOnboarding);
  const applyPlayer = useAppStore((state) => state.applyPlayer);
  const [username, setUsername] = useState("");
  const [year, setYear] = useState(3);
  const [avatar, setAvatar] = useState<AvatarConfig>(defaultAvatar);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function finish() {
    if (saving) return;
    setSaveError(null);
    const error = validateUsername(username);
    if (error) { setSaveError(error); Alert.alert("Choose a username", error); return; }
    setSaving(true);
    try {
      const normalizedUsername = username.trim();
      if (!(await isUsernameAvailableRemote(normalizedUsername))) {
        setSaveError("That username is already taken. Try another one.");
        return;
      }
      let historicalReward: Awaited<ReturnType<typeof initializePhdSurvivalRemote>> = null;
      if (isSupabaseConfigured) {
        await updateProfileRemote(normalizedUsername, year, avatar);
        // Profile creation must not be blocked if the optional historical-XP
        // migration has not been applied to Supabase yet.
        try { historicalReward = await initializePhdSurvivalRemote(year); } catch { historicalReward = null; }
      }
      complete(normalizedUsername, year, avatar);
      if (historicalReward?.totalXp !== undefined) {
        const currentPlayer = useAppStore.getState().player;
        applyPlayer({ ...currentPlayer, totalXp: historicalReward.totalXp, level: historicalReward.level ?? currentPlayer.level });
      }
      router.replace("/(tabs)/home");
    } catch (remoteError) {
      const message = isUsernameConflict(remoteError) ? "That username is already taken. Try another one." : remoteError instanceof Error ? remoteError.message : "Please try again.";
      setSaveError(message);
      Alert.alert("Could not save your character", message);
    } finally {
      setSaving(false);
    }
  }

  return <Screen>
    <View style={styles.header}>
      <Text style={styles.eyebrow}>CHARACTER CREATION</Text>
      <Text style={styles.title}>Give your PhD a face.</Text>
      <Text style={styles.copy}>Build the tiny research sidekick who will survive every chapter with you.</Text>
    </View>
    <View style={styles.avatarStage}><AvatarRenderer config={avatar} size={220} /></View>
    <AvatarAssetPicker value={avatar} onChange={setAvatar} />
    <Text style={styles.label}>USERNAME</Text>
    <TextInput autoCapitalize="none" value={username} onChangeText={setUsername} placeholder="e.g. labrat_01" placeholderTextColor={colors.muted} style={styles.input} />
    <Text style={styles.label}>CURRENT PhD YEAR</Text>
    <View style={styles.yearRow}>{[1, 2, 3, 4, 5, 6, 7, 8].map((item) => <Chip key={item} label={item === 8 ? "8+" : `Year ${item}`} selected={year === item} onPress={() => setYear(item)} />)}</View>
    {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
    <Button label={saving ? "Saving character…" : "Create character"} disabled={saving} onPress={() => void finish()} style={styles.finish} />
  </Screen>;
}

function isUsernameConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof details.code === "string" ? details.code : "";
  const text = [details.message, details.details].filter((value): value is string => typeof value === "string").join(" ").toLowerCase();
  return code === "23505" || text.includes("profiles_username_ci") || (text.includes("duplicate") && text.includes("username"));
}

const styles = StyleSheet.create({
  header: { paddingTop: 14, marginBottom: 4 },
  eyebrow: { color: colors.coral, fontWeight: "900", letterSpacing: 1.3, fontSize: 11 },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 30, marginTop: 7 },
  copy: { color: colors.muted, lineHeight: 21, marginTop: 5 },
  avatarStage: { minHeight: 220, alignItems: "center", justifyContent: "center", marginVertical: 10 },
  label: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: spacing.md, marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.white, paddingHorizontal: 15, color: colors.ink, fontSize: 15 },
  yearRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  finish: { marginTop: 25, marginBottom: 12 },
  error: { color: colors.coral, fontSize: typography.metadata, lineHeight: 18, marginTop: spacing.md },
});
