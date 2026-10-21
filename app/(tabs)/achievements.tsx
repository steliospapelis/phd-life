import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useState } from "react";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Screen } from "@/src/components/ui/Screen";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SectionTitle } from "@/src/components/ui/SectionTitle";
import { borders, colors, iconSizes, radii, spacing, typography } from "@/src/config/theme";
import { useAppStore } from "@/src/store/useAppStore";
import { ScrollablePanel } from "@/src/components/ui/ScrollablePanel";
import { AnimatedProgressFill, FocusFade } from "@/src/components/ui/Motion";

export function AchievementsContent() {
  const { achievements } = useAppStore();
  const { height } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const unlocked = achievements.filter((item) => item.unlocked).length;
  const completion = achievements.length === 0 ? 0 : Math.round((unlocked / achievements.length) * 100);

  return <>
    <FocusFade delay={45}><Card tone="surface" style={styles.summaryCard}>
      <View style={styles.summaryTop}><View><Text style={styles.summaryLabel}>BADGE PROGRESS</Text><Text style={styles.summaryCopy}>{unlocked} / {achievements.length} badges unlocked</Text></View><Text style={styles.summaryPercent}>{completion}%</Text></View>
      <View style={styles.track}><AnimatedProgressFill percentage={completion} style={styles.trackFill} /></View>
    </Card></FocusFade>

    <FocusFade delay={80}><SectionTitle title="Achievement Badges" /></FocusFade>
    <FocusFade delay={110} style={styles.listMotion}><ScrollablePanel style={[styles.listFrame, { maxHeight: Math.max(220, height - 420) }]} contentContainerStyle={styles.grid}>
      {achievements.length === 0 ? <EmptyState title="No achievements yet." message="Don't worry. Academia will provide opportunities." icon={<Text style={styles.emptyIcon}>✦</Text>} /> : null}
      {achievements.map((item, index) => <FocusFade key={item.id} delay={index * 25} style={styles.badgeMotion}><Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.unlocked ? "unlocked" : "locked"}`} onPress={() => setSelectedId(item.id)} style={({ pressed }) => [styles.badge, item.unlocked && styles.unlocked, !item.unlocked && styles.locked, pressed && styles.pressed]}>
        <View style={[styles.icon, item.unlocked ? styles.iconEarned : styles.iconLocked]}><Text style={styles.iconText}>{getBadgeEmoji(item)}</Text></View>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.progressTarget ? `${Math.min(item.progressCurrent ?? 0, item.progressTarget)} / ${item.progressTarget}` : item.unlocked ? "Completed" : "Keep surviving"}</Text>
        <Text style={[styles.rarity, !item.unlocked && styles.lockedText]}>{item.unlocked ? item.rarity.toUpperCase() : "LOCKED"}</Text>
      </Pressable></FocusFade>)}
    </ScrollablePanel></FocusFade>

    <BottomSheet visible={Boolean(selectedId)} title={achievements.find((item) => item.id === selectedId)?.name ?? "Achievement"} onClose={() => setSelectedId(null)}>
      {achievements.find((item) => item.id === selectedId) ? <View><Text style={styles.sheetIcon}>{getBadgeEmoji(achievements.find((item) => item.id === selectedId)!)}</Text><Text style={styles.sheetDescription}>{achievements.find((item) => item.id === selectedId)?.description}</Text>{achievements.find((item) => item.id === selectedId)?.progressTarget ? <Text style={styles.sheetProgress}>{achievements.find((item) => item.id === selectedId)?.progressCurrent ?? 0} / {achievements.find((item) => item.id === selectedId)?.progressTarget}</Text> : null}<Text style={styles.sheetStatus}>{achievements.find((item) => item.id === selectedId)?.unlocked ? "Achievement unlocked." : "Locked for now. Academia will provide opportunities."}</Text></View> : null}
    </BottomSheet>
  </>;
}

export default function Achievements() { return <Screen scroll={false}><AppHeader eyebrow="ACHIEVEMENT ARCHIVE" title="Achievements" subtitle="The receipts are real. Every small win adds up." /><AchievementsContent /></Screen>; }

const BADGE_EMOJIS: Record<string, string> = {
  "it-begins": "🌱", "paper-trail": "📚", "pdf-collector": "📖", "citation-machine": "🔖", "literature-cartographer": "🗺️",
  "works-on-my-machine": "💻", "debugging-diplomat": "🐞", "data-cleaner": "🧹", "science-technically-occurred": "🧪", "results-have-entered-the-chat": "📊",
  "inbox-warrior": "📨", "calendar-tetris": "🗓️", "admin-adjacent": "🗂️", "helpful-by-accident": "🤝", "teaching-assistant-energy": "🎓",
  "conference-creature": "🎤", posterity: "🖼️", "submission-season": "📤", "publication-adjacent": "🏅", "all-the-tabs": "🗃️",
  "active-researcher": "🔬", "research-has-become-a-lifestyle": "🌙", "still-here": "🫡", "milestone-courses": "🎓", "milestone-conference": "🎟️",
  "milestone-presentation": "📣", "milestone-paper-submission": "📨", "milestone-publication": "🏆", "milestone-main-experiment": "⚗️", "milestone-analysis": "📈",
  "milestone-thesis-draft": "📝", "milestone-defence": "🛡️",
};

function getBadgeEmoji(item: { badgeKey?: string; iconKey: string; category?: string }) {
  if (item.badgeKey && BADGE_EMOJIS[item.badgeKey]) return BADGE_EMOJIS[item.badgeKey];
  if (item.iconKey && !/^[a-z0-9-]+$/i.test(item.iconKey)) return item.iconKey;
  if (item.category?.includes("Coding")) return "💻";
  if (item.category?.includes("Research")) return "🔬";
  if (item.category?.includes("Teaching")) return "🎓";
  if (item.category?.includes("Experiment")) return "🧪";
  return "🏅";
}

const styles = StyleSheet.create({
  emptyIcon: { color: colors.coral, fontSize: 24 },
  countPill: { backgroundColor: colors.primary, borderRadius: radii.card, minWidth: 58, minHeight: 58, alignItems: "center", justifyContent: "center" },
  countValue: { color: colors.secondary, fontFamily: typography.display, fontSize: 26, lineHeight: 29 },
  countLabel: { color: colors.white, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  summaryCard: { marginBottom: spacing.xl, backgroundColor: colors.surface, borderColor: colors.border }, listMotion: { flex: 1 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  summaryLabel: { color: colors.secondary, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.1 },
  summaryCopy: { color: colors.primary, fontSize: typography.metadata, marginTop: spacing.xs },
  summaryPercent: { color: colors.primary, fontFamily: typography.display, fontSize: 34, lineHeight: 38 },
  track: { height: 10, borderRadius: radii.pill, backgroundColor: "#C9DDCD", overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.secondary },
  sectionEyebrow: { color: colors.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.25, marginBottom: 3 },
  sectionTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 24 },
  sectionHint: { color: colors.muted, fontSize: 11, fontWeight: "800", marginBottom: 3 },
  listFrame: { borderWidth: borders.width, borderColor: colors.border, borderRadius: radii.card, backgroundColor: colors.surface, padding: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm, paddingBottom: spacing.xl },
  badgeMotion: { width: "48.5%" },
  badge: { width: "100%", minHeight: 160, backgroundColor: colors.surface, borderWidth: borders.width, borderColor: colors.border, borderRadius: radii.card, padding: spacing.md },
  unlocked: { backgroundColor: colors.mint, borderColor: "#C9DDCD" },
  locked: { opacity: 0.46 },
  icon: { width: iconSizes.md, height: iconSizes.md, borderRadius: radii.control, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  iconEarned: { backgroundColor: colors.mint },
  iconLocked: { backgroundColor: colors.surfaceElevated },
  iconText: { fontSize: 22 },
  name: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "900" },
  description: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  rarity: { color: colors.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: "auto" },
  lockedText: { color: colors.muted },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  sheetIcon: { fontSize: 32, marginBottom: spacing.sm },
  sheetDescription: { color: colors.textSecondary, fontSize: typography.bodySize, lineHeight: 22 },
  sheetProgress: { color: colors.coral, fontFamily: typography.display, fontSize: 24, marginTop: spacing.md },
  sheetStatus: { color: colors.secondary, fontSize: typography.metadata, fontWeight: "800", marginTop: spacing.md },
});
