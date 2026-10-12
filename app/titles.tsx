import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Button } from "@/src/components/ui/Button";
import { Chip } from "@/src/components/ui/Chip";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { getXpProgress } from "@/src/domain/game";
import { useAppStore } from "@/src/store/useAppStore";
import { isSupabaseConfigured } from "@/src/config/app";
import { selectTitleRemote } from "@/src/services/gameService";
import type { Title } from "@/src/types/models";

type Filter = "all" | "level" | "milestone" | "achievement" | "locked";

export default function Titles() {
  const { profile, player, titles, selectTitle } = useAppStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const progress = getXpProgress(player.totalXp);
  const isUnlocked = useCallback((title: Title) => title.unlocked ?? (title.source === "level" && (title.requiredLevel ?? title.unlockLevel ?? 999) <= progress.level), [progress.level]);
  const visibleTitles = useMemo(() => titles.filter((title) => {
    if (filter === "locked") return !isUnlocked(title);
    if (filter === "all") return true;
    return title.source === filter;
  }).sort((a, b) => {
    const equipped = (title: Title) => title.name === profile.selectedTitle ? 0 : isUnlocked(title) ? 1 : 2;
    return equipped(a) - equipped(b) || (a.requiredLevel ?? 999) - (b.requiredLevel ?? 999) || a.name.localeCompare(b.name);
  }), [filter, isUnlocked, profile.selectedTitle, titles]);

  async function equip(title: Title) {
    if (!isUnlocked(title) || busy) return;
    setBusy(title.id);
    try {
      if (isSupabaseConfigured) await selectTitleRemote(title.name);
      selectTitle(title.name);
      setNotice(`Equipped ${title.name}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not equip that title.");
    } finally { setBusy(null); }
  }

  return <Screen>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text><Text style={styles.backLabel}>Back</Text></Pressable>
    <AppHeader eyebrow="CALLING CARD" title="Titles" subtitle="A collection of earned names for surviving the work." />
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    <Card tone="navy" style={styles.currentCard}><Text style={styles.currentEyebrow}>CURRENT TITLE</Text><Text style={styles.currentTitle}>{profile.selectedTitle}</Text><Text style={styles.currentMeta}>Level {progress.level} · Explicitly equipped by you</Text></Card>
    <View style={styles.filters}>{(["all", "level", "milestone", "achievement", "locked"] as Filter[]).map((item) => <Chip key={item} label={item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)} selected={filter === item} onPress={() => setFilter(item)} />)}</View>
    <View style={styles.list}>{visibleTitles.map((title) => {
      const unlocked = isUnlocked(title);
      const equipped = title.name === profile.selectedTitle;
      const requirement = title.source === "level" ? `Level ${title.requiredLevel ?? title.unlockLevel}` : title.source === "milestone" ? "Milestone reward" : "Achievement reward";
      return <View key={title.id} style={[styles.row, equipped && styles.equipped, !unlocked && styles.locked]}><View style={styles.copy}><Text style={styles.name}>{title.name}</Text><Text style={styles.requirement}>{equipped ? "Equipped" : unlocked ? requirement : `Locked · ${requirement}`}</Text></View>{unlocked && !equipped ? <Button label={busy === title.id ? "Saving…" : "Equip"} disabled={Boolean(busy)} onPress={() => void equip(title)} style={styles.equip} /> : <Text style={[styles.status, unlocked && styles.equippedText]}>{equipped ? "EQUIPPED" : "LOCKED"}</Text>}</View>;
    })}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 44, alignSelf: "flex-start", marginBottom: spacing.sm },
  backText: { color: colors.primary, fontSize: 25 }, backLabel: { color: colors.secondary, fontSize: 13, fontWeight: "900" },
  notice: { color: colors.secondary, backgroundColor: colors.mint, borderRadius: radii.control, padding: spacing.sm, textAlign: "center", fontSize: typography.metadata, fontWeight: "800", marginBottom: spacing.md },
  currentCard: { marginBottom: spacing.xl }, currentEyebrow: { color: colors.gold, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.1 }, currentTitle: { color: colors.white, fontFamily: typography.display, fontSize: 25, marginTop: spacing.sm }, currentMeta: { color: "#D9E1E8", fontSize: typography.metadata, marginTop: spacing.xs },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md }, list: { borderTopWidth: 1, borderTopColor: colors.line }, row: { minHeight: 70, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }, equipped: { backgroundColor: colors.mint, paddingHorizontal: spacing.sm }, locked: { opacity: 0.5 }, copy: { flex: 1, minWidth: 0 }, name: { color: colors.primary, fontSize: 14, fontWeight: "900" }, requirement: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: 3 }, equip: { minHeight: 40, paddingHorizontal: spacing.md }, status: { color: colors.textSecondary, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, equippedText: { color: colors.secondary },
});
