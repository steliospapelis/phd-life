import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { Screen } from "@/src/components/ui/Screen";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { RewardSummarySheet } from "@/src/components/game/RewardSummarySheet";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionTitle } from "@/src/components/ui/SectionTitle";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { getPhdProgress } from "@/src/domain/game";
import { useAppStore } from "@/src/store/useAppStore";
import type { Achievement, Milestone, TaskCompletionResult, Title } from "@/src/types/models";
import { isSupabaseConfigured } from "@/src/config/app";
import { toggleMilestoneRemote } from "@/src/services/gameService";
import { ScrollablePanel } from "@/src/components/ui/ScrollablePanel";
import { AnimatedProgressFill, FocusFade } from "@/src/components/ui/Motion";

export function JourneyContent() {
  const milestones = useAppStore((state) => state.milestones);
  const { height } = useWindowDimensions();
  const toggle = useAppStore((state) => state.toggleMilestone);
  const player = useAppStore((state) => state.player);
  const applyPlayer = useAppStore((state) => state.applyPlayer);
  const [selected, setSelected] = useState<Milestone | null>(null);
  const [reward, setReward] = useState<TaskCompletionResult | null>(null);
  const progress = getPhdProgress(milestones);
  const selectedMilestone = selected ? milestones.find((item) => item.id === selected.id) ?? selected : null;

  async function toggleSelected() {
    if (!selectedMilestone || selectedMilestone.completed || selectedMilestone.isAutomatic) return;
    type MilestoneRewardResponse = { completed?: boolean; alreadyCompleted?: boolean; milestone?: { id: string; title: string }; unlockedTitles?: unknown[]; unlockedAchievements?: unknown[]; achievementXpAwarded?: number; xpAwarded?: number; xpGained?: number; totalXp?: number; previousLevel?: number; currentLevel?: number; level?: number; sanity?: number };
    const remoteReward: MilestoneRewardResponse | null = isSupabaseConfigured ? await toggleMilestoneRemote(selectedMilestone.id) as MilestoneRewardResponse : null;
    const localReward = toggle(selectedMilestone.id);
    const completedReward = remoteReward ? { completed: Boolean(remoteReward.completed), milestone: remoteReward.milestone, xpAwarded: remoteReward.xpAwarded, xpGained: remoteReward.xpGained, achievementXpAwarded: remoteReward.achievementXpAwarded, totalXp: remoteReward.totalXp, level: remoteReward.level, currentLevel: remoteReward.currentLevel, previousLevel: remoteReward.previousLevel, sanity: remoteReward.sanity, unlockedTitles: remoteReward.unlockedTitles, unlockedAchievements: remoteReward.unlockedAchievements } : localReward ? { completed: true, milestone: localReward.completedMilestone, xpAwarded: localReward.xpAwarded, xpGained: localReward.xpGained, achievementXpAwarded: localReward.achievementXpAwarded, totalXp: localReward.totalXp, level: localReward.level, currentLevel: localReward.currentLevel, previousLevel: localReward.previousLevel, sanity: localReward.sanity, unlockedTitles: localReward.unlockedTitles, unlockedAchievements: localReward.unlockedAchievements } : null;
    if (completedReward?.completed) {
      const totalXp = completedReward.totalXp ?? useAppStore.getState().player.totalXp;
      const level = completedReward.level ?? completedReward.currentLevel ?? useAppStore.getState().player.level;
      const previousLevel = completedReward.previousLevel ?? player.level;
      if (remoteReward) applyPlayer({ totalXp, level, sanity: completedReward.sanity ?? player.sanity });
      setReward({ xpAwarded: completedReward.xpAwarded ?? selectedMilestone.xpReward, xpGained: completedReward.xpGained ?? completedReward.xpAwarded ?? selectedMilestone.xpReward, achievementXpAwarded: completedReward.achievementXpAwarded ?? 0, totalXp, sanity: completedReward.sanity ?? player.sanity, level, previousLevel, currentLevel: level, levelUp: level > previousLevel, acknowledgement: "MILESTONE COMPLETE", completedMilestone: completedReward.milestone ?? { id: selectedMilestone.id, title: selectedMilestone.title }, unlockedTitles: (completedReward.unlockedTitles ?? []) as Title[], unlockedAchievements: (completedReward.unlockedAchievements ?? []) as Achievement[] });
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setSelected(null);
  }

  return <>
    <FocusFade delay={45}><Card tone="surface" style={styles.progressCard}><View style={styles.progressTop}><View><Text style={styles.progressLabel}>YOUR PhD JOURNEY</Text><Text style={styles.progressCopy}>{milestones.filter((item) => item.completed).length} / {milestones.length} milestones completed</Text></View><Text style={styles.progressNumber}>{progress}%</Text></View><View style={styles.track}><AnimatedProgressFill percentage={progress} style={styles.fill} /></View></Card></FocusFade>
    <FocusFade delay={80}><SectionTitle title="Progress Milestones" /></FocusFade>
    <FocusFade delay={110} style={styles.listMotion}><ScrollablePanel style={[styles.listFrame, { maxHeight: Math.max(180, height - 440) }]} contentContainerStyle={styles.grid}>
      {milestones.map((milestone, index) => <FocusFade key={milestone.id} delay={index * 30} style={styles.nodeMotion}><Pressable accessibilityRole="button" accessibilityLabel={`${milestone.title}, ${milestone.completed ? "completed" : "not completed"}`} accessibilityHint="Opens milestone details" onPress={() => setSelected(milestone)} style={({ pressed }) => [styles.node, milestone.completed && styles.completed, pressed && styles.pressed]}><View style={[styles.nodeIcon, milestone.completed && styles.completedIcon]}><Text style={styles.icon}>{milestone.iconKey}</Text>{milestone.completed ? <Text style={styles.check}>✓</Text> : null}</View><Text style={styles.nodeTitle} numberOfLines={2}>{milestone.title}</Text><Text style={[styles.status, milestone.completed && styles.statusDone]}>{milestone.completed ? "COMPLETED" : "NOT YET COMPLETED"}</Text></Pressable></FocusFade>)}
    </ScrollablePanel></FocusFade>
    <BottomSheet visible={Boolean(selectedMilestone)} title={selectedMilestone?.title ?? "Milestone"} onClose={() => setSelected(null)}>
      {selectedMilestone ? <View><Text style={styles.sheetIcon}>{selectedMilestone.iconKey}</Text><Text style={styles.sheetDescription}>{selectedMilestone.description}</Text><View style={styles.rewardRows}><Text style={styles.rewardValue}>+{selectedMilestone.xpReward} XP</Text><Text style={styles.rewardValue}>+{selectedMilestone.weight}% PhD Progress</Text></View><Text style={[styles.status, selectedMilestone.completed && styles.statusDone]}>{selectedMilestone.completed ? "COMPLETED" : "NOT YET COMPLETED"}</Text>{selectedMilestone.isAutomatic ? <Text style={styles.automaticNote}>Automatically recorded when your account was created.</Text> : selectedMilestone.completed ? null : <Button label="Mark complete" onPress={() => void toggleSelected()} style={styles.sheetButton} />}</View> : null}
    </BottomSheet>
    <RewardSummarySheet reward={reward} onClose={() => setReward(null)} onViewTitles={() => setReward(null)} />
  </>;
}

export default function Journey() { return <Screen scroll={false}><AppHeader eyebrow="YOUR PhD" title="Journey" subtitle="Estimated with questionable academic methodology." /><JourneyContent /></Screen>; }

const styles = StyleSheet.create({
  progressCard: { marginBottom: spacing.xl, backgroundColor: colors.surface, borderColor: colors.border }, progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }, progressLabel: { color: colors.secondary, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.1 }, progressCopy: { color: colors.primary, fontSize: typography.metadata, marginTop: spacing.xs }, progressNumber: { color: colors.primary, fontFamily: typography.display, fontSize: 34, lineHeight: 38 }, track: { backgroundColor: colors.surfaceElevated, height: 10, borderRadius: radii.pill, overflow: "hidden" }, fill: { backgroundColor: colors.secondary, borderRadius: radii.pill }, listMotion: { flex: 1 }, listFrame: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, backgroundColor: colors.surface, padding: spacing.xs, marginBottom: spacing.lg }, grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm, paddingBottom: spacing.xl, paddingRight: spacing.md }, nodeMotion: { width: "48.5%" }, node: { width: "100%", minHeight: 108, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: spacing.md }, completed: { backgroundColor: colors.mint, borderColor: "#C9DDCD" }, nodeIcon: { width: 36, height: 36, backgroundColor: colors.surfaceElevated, borderRadius: radii.control, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm, position: "relative" }, completedIcon: { backgroundColor: colors.surface }, icon: { fontSize: 18 }, check: { position: "absolute", right: -4, top: -6, color: colors.surface, backgroundColor: colors.secondary, width: 16, height: 16, borderRadius: 8, textAlign: "center", fontSize: 10, lineHeight: 16, fontWeight: "900" }, nodeTitle: { color: colors.primary, fontWeight: "900", fontSize: typography.metadata + 1, lineHeight: 17 }, status: { color: colors.textSecondary, fontSize: 8, fontWeight: "900", letterSpacing: 0.6, marginTop: spacing.sm }, statusDone: { color: colors.secondary }, pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] }, sheetIcon: { fontSize: 30, marginBottom: spacing.sm }, sheetDescription: { color: colors.textSecondary, fontSize: typography.bodySize, lineHeight: 22 }, rewardRows: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: spacing.md, paddingTop: spacing.md, gap: spacing.xs }, rewardValue: { color: colors.coral, fontSize: typography.bodySize, fontWeight: "900" }, automaticNote: { color: colors.muted, fontSize: typography.metadata, lineHeight: 18, marginTop: spacing.sm }, sheetButton: { marginTop: spacing.lg }
});
