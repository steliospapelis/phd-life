import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import type { TaskCompletionResult } from "@/src/types/models";
import { shareAchievementRemote, shareMilestoneRemote, shareTaskRemote } from "@/src/services/socialService";
import { useAppStore } from "@/src/store/useAppStore";
import { UnlockPulse, useReducedMotion } from "@/src/components/ui/Motion";

export function RewardSummarySheet({ reward, onClose, onViewTitles }: { reward: TaskCompletionResult | null; onClose: () => void; onViewTitles: () => void }) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    opacity.stopAnimation();
    scale.stopAnimation();
    if (!reward || reducedMotion) {
      opacity.setValue(reward ? 1 : 0);
      scale.setValue(1);
      return undefined;
    }
    opacity.setValue(0);
    scale.setValue(0.97);
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 3, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion, reward, scale]);

  if (!reward) return null;
  const titles = reward.unlockedTitles ?? [];
  const achievements = reward.unlockedAchievements ?? [];
  const milestone = reward.completedMilestone;
  const majorTask = reward.completedTask?.isMajor ? reward.completedTask : null;
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><Pressable accessibilityLabel="Close rewards" style={styles.dismissArea} onPress={onClose} /><Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}><SafeAreaView edges={["bottom", "top"]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>{reward.levelUp ? "LEVEL UP" : milestone ? "MILESTONE COMPLETE" : "REWARDS UNLOCKED"}</Text>
      <Text style={styles.heading}>{reward.levelUp ? `Lv. ${reward.previousLevel ?? reward.level} → Lv. ${reward.currentLevel ?? reward.level}` : milestone?.title ?? majorTask?.name ?? "A little more proof"}</Text>
      {majorTask ? <View><RewardSection label="Major task" items={[majorTask.name]} /><ShareActivityButton key={majorTask.id} sourceType="task" sourceId={majorTask.id} title={majorTask.name} flavorText="A major research win has entered the record." categoryName={majorTask.categoryName} /></View> : null}
      {milestone ? <View><RewardSection label="Milestone" items={[milestone.title]} /><ShareActivityButton key={milestone.id} sourceType="milestone" sourceId={milestone.id} title={milestone.title} flavorText="One more plot twist handled." /></View> : null}
      {achievements.length > 0 ? <UnlockPulse><View style={styles.section}><Text style={styles.sectionLabel}>Achievement unlocked</Text>{achievements.map((item) => <View key={item.id} style={styles.achievementRow}><Text style={[styles.item, styles.achievementName]}>✦ {item.name} · +{item.xpReward ?? 20} XP</Text><ShareActivityButton compact sourceType="achievement" sourceId={item.id} title={item.name} flavorText={item.description} /></View>)}</View></UnlockPulse> : null}
      {titles.length > 0 ? <UnlockPulse><RewardSection label="New titles" items={titles.slice(0, 4).map((item) => item.name)} extra={titles.length > 4 ? `+${titles.length - 4} more titles` : undefined} /></UnlockPulse> : null}
      <View style={styles.actions}>{titles.length > 0 ? <Pressable accessibilityRole="button" onPress={onViewTitles} style={styles.secondary}><Text style={styles.secondaryText}>View titles</Text></Pressable> : null}<Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}><Text style={styles.primaryText}>Continue</Text></Pressable></View>
    </ScrollView></SafeAreaView></Animated.View></View>
  </Modal>;
}

function RewardSection({ label, items, extra }: { label: string; items: string[]; extra?: string }) {
  return <View style={styles.section}><Text style={styles.sectionLabel}>{label}</Text>{items.map((item) => <Text key={item} style={styles.item}>✦ {item}</Text>)}{extra ? <Text style={styles.extra}>{extra}</Text> : null}</View>;
}

function ShareActivityButton({ sourceType, sourceId, title, flavorText, categoryName, compact = false }: { sourceType: "achievement" | "milestone" | "task"; sourceId: string; title: string; flavorText: string; categoryName?: string; compact?: boolean }) {
  const { profile, appendSocialEvents } = useAppStore();
  const [status, setStatus] = useState<"idle" | "sharing" | "shared" | "error">("idle");
  async function share() {
    if (status === "sharing" || status === "shared") return;
    setStatus("sharing");
    try {
      const result = sourceType === "milestone" ? await shareMilestoneRemote(sourceId) : sourceType === "achievement" ? await shareAchievementRemote(sourceId) : await shareTaskRemote(sourceId);
      if (result.shared) {
        const sharedAt = new Date().toISOString();
        appendSocialEvents([{
          id: result.activityId ?? `local-share-${sourceType}-${sourceId}`,
          userId: profile.id,
          username: profile.username,
          avatar: profile.avatar,
          type: sourceType,
          sourceId,
          createdAt: sharedAt,
          sharedAt,
          metadata: { title, flavorText, ...(categoryName ? { categoryName } : {}) },
          reactions: {},
          citationCount: 0,
          citationUsers: [],
          userHasCitation: false,
        }]);
      }
      setStatus(result.shared ? "shared" : "shared");
    } catch { setStatus("error"); }
  }
  return <View style={[styles.shareWrap, compact && styles.shareWrapCompact]}><Pressable accessibilityRole="button" accessibilityState={{ disabled: status === "sharing", selected: status === "shared" }} disabled={status === "sharing" || status === "shared"} onPress={() => void share()} style={[styles.shareButton, compact && styles.shareButtonCompact, status === "shared" && styles.shareButtonShared]}><Text style={[styles.shareButtonText, compact && styles.shareButtonTextCompact, status === "shared" && styles.shareButtonTextShared]}>{status === "sharing" ? "Sharing…" : status === "shared" ? "Shared ✓" : compact ? "Share" : "Share with labmates"}</Text></Pressable>{status === "error" ? <Text style={styles.shareError}>Couldn&apos;t share this right now. Try again.</Text> : null}</View>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(23, 52, 92, 0.42)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  dismissArea: { ...StyleSheet.absoluteFill },
  card: { width: "100%", maxWidth: 520, maxHeight: "88%", backgroundColor: colors.background, borderRadius: radii.hero, borderWidth: 1, borderColor: colors.border, shadowColor: colors.primary, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  content: { padding: spacing.xl }, eyebrow: { color: colors.coral, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.3 }, heading: { color: colors.primary, fontFamily: typography.display, fontSize: 29, lineHeight: 34, marginTop: spacing.sm }, copy: { color: colors.textSecondary, fontSize: typography.bodySize, lineHeight: 21, marginTop: spacing.sm },
  section: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, marginTop: spacing.lg }, sectionLabel: { color: colors.secondary, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" }, item: { color: colors.primary, fontSize: 16, fontWeight: "900", marginTop: spacing.sm }, achievementRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }, achievementName: { flex: 1, marginTop: 0, fontSize: 14 }, extra: { color: colors.textSecondary, fontSize: typography.metadata, fontWeight: "800", marginTop: spacing.sm },
  shareWrap: { marginTop: spacing.md }, shareWrapCompact: { marginTop: 0, flexShrink: 0 }, shareButton: { minHeight: 44, borderRadius: radii.control, borderWidth: 1, borderColor: colors.secondary, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md }, shareButtonCompact: { minHeight: 36, paddingHorizontal: spacing.sm }, shareButtonShared: { backgroundColor: colors.mint }, shareButtonText: { color: colors.secondary, fontSize: typography.metadata, fontWeight: "900" }, shareButtonTextCompact: { fontSize: 10 }, shareButtonTextShared: { color: colors.secondary }, shareSuccess: { color: colors.secondary, fontSize: 11, fontWeight: "800", marginTop: spacing.xs }, shareError: { color: colors.coral, fontSize: 11, fontWeight: "800", marginTop: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl }, primary: { flex: 1, minHeight: 50, borderRadius: radii.control, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }, primaryText: { color: colors.surface, fontWeight: "900" }, secondary: { minHeight: 50, borderRadius: radii.control, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" }, secondaryText: { color: colors.secondary, fontWeight: "900" },
});
