import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Screen } from "@/src/components/ui/Screen";
import { colors, radii, spacing } from "@/src/config/theme";
import { JourneyContent } from "./journey";
import { AchievementsContent } from "./achievements";

export default function Phd() {
  const [mode, setMode] = useState<"journey" | "achievements">("journey");
  return <Screen scroll={false}>
    <AppHeader title="Journey" subtitle="Plot twists, progress bars, and one suspiciously long thesis." />
    <View accessibilityRole="tablist" style={styles.segmented}>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === "journey" }} onPress={() => setMode("journey")} style={[styles.segment, mode === "journey" && styles.segmentSelected]}><Text style={[styles.segmentText, mode === "journey" && styles.segmentTextSelected]}>PhD Progress</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === "achievements" }} onPress={() => setMode("achievements")} style={[styles.segment, mode === "achievements" && styles.segmentSelected]}><Text style={[styles.segmentText, mode === "achievements" && styles.segmentTextSelected]}>Achievements</Text></Pressable>
    </View>
    {mode === "journey" ? <JourneyContent /> : <AchievementsContent />}
  </Screen>;
}

const styles = StyleSheet.create({ segmented: { flexDirection: "row", width: "100%", minHeight: 42, padding: spacing.xs, borderRadius: radii.control, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl }, segment: { flex: 1, minHeight: 34, borderRadius: radii.control - 3, alignItems: "center", justifyContent: "center" }, segmentSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, segmentText: { color: colors.textSecondary, fontSize: 13, fontWeight: "800" }, segmentTextSelected: { color: colors.primary, fontWeight: "900" } });
