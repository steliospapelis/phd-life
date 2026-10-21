import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { animationDuration, colors, radii, spacing, typography } from "@/src/config/theme";
import { getXpProgress } from "@/src/domain/game";
import type { PlayerState, Task } from "@/src/types/models";

type TaskLogSheetProps = { task: Task | null; player: PlayerState; error: string | null; busy: boolean; onConfirm: () => void; onClose: () => void };

export function TaskLogSheet({ task, player, error, busy, onConfirm, onClose }: TaskLogSheetProps) {
  const current = getXpProgress(player.totalXp);
  const projected = task ? getXpProgress(player.totalXp + task.xpReward) : current;
  const [animatedProgress] = useState(() => new Animated.Value(current.percentage));
  const progressTaskId = useRef<string | null>(null);
  const progressTarget = useRef(projected.percentage);
  const taskId = task?.id ?? null;

  useEffect(() => {
    if (progressTaskId.current !== taskId) {
      progressTaskId.current = taskId;
      progressTarget.current = projected.percentage;
      animatedProgress.stopAnimation();
      animatedProgress.setValue(current.percentage);
    }
    if (!task || !busy) {
      animatedProgress.stopAnimation();
      animatedProgress.setValue(current.percentage);
      return;
    }
    const animation = Animated.timing(animatedProgress, {
      toValue: progressTarget.current,
      duration: animationDuration.progress,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, busy, current.percentage, projected.percentage, task, taskId]);

  const progressWidth = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return <Modal visible={Boolean(task)} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}><Pressable accessibilityLabel="Close task logger" style={styles.dismissArea} onPress={onClose} disabled={busy} />
      <SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}><Pressable accessibilityRole="button" accessibilityLabel="Close task logger" onPress={onClose} disabled={busy} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
        {task ? <>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.taskCategory}>{task.categoryName}</Text>
          <View style={styles.taskIcon}><Text style={styles.taskIconText}>{task.iconKey}</Text></View>
          <Text style={styles.taskDescription}>{task.description ?? "A real piece of PhD progress, now properly documented."}</Text>
          {error ? <View accessibilityRole="alert" style={styles.errorCard}><Text style={styles.errorTitle}>Could not save this field note</Text><Text style={styles.errorCopy}>{error}</Text></View> : null}
          <View style={styles.rewardCard}><View><Text style={styles.rewardLabel}>REWARD</Text><Text style={styles.rewardValue}>+{task.xpReward} XP</Text></View><Text style={styles.rewardNote}>{task.isMajor ? "Major milestone" : "Small win, real progress"}</Text></View>
          <View style={styles.progressBlock}><View style={styles.progressMeta}><Text style={styles.progressLabel}>CURRENT LEVEL {current.level}</Text><Text style={styles.progressValue}>{current.intoLevel} / {current.required} XP</Text></View><View style={styles.track}><Animated.View style={[styles.fill, { width: progressWidth }]} /></View><Text style={styles.afterText}>After logging: {projected.level > current.level ? `Level ${projected.level} 🎉` : `${projected.intoLevel} / ${projected.required} XP`}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Confirm logging ${task.name} for ${task.xpReward} XP`} disabled={busy} onPress={onConfirm} style={({ pressed }) => [styles.confirm, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.confirmText}>{busy ? "Saving your win…" : error ? "Try logging again" : "Log this win"}</Text></Pressable>
        </> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(23, 52, 92, 0.42)", justifyContent: "flex-end" },
  dismissArea: { flex: 1 },
  sheet: { maxHeight: "92%", backgroundColor: colors.background, borderTopLeftRadius: radii.hero, borderTopRightRadius: radii.hero, overflow: "hidden" },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHeader: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  close: { width: 35, height: 35, borderRadius: radii.control, backgroundColor: colors.cream, justifyContent: "center", alignItems: "center" },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 27, fontWeight: "300" },
  taskIcon: { width: 62, height: 62, borderRadius: radii.hero, backgroundColor: colors.peach, justifyContent: "center", alignItems: "center", marginTop: spacing.md, marginBottom: spacing.md },
  taskIconText: { fontSize: 31 },
  taskName: { color: colors.ink, fontFamily: typography.display, fontSize: 28 },
  taskCategory: { color: colors.coral, fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: 4, textTransform: "uppercase" },
  taskDescription: { color: colors.muted, lineHeight: 20, marginTop: 11 },
  rewardCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radii.card, padding: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  rewardLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  rewardValue: { color: colors.coral, fontFamily: typography.display, fontSize: 25, marginTop: 2 },
  rewardNote: { color: colors.teal, fontSize: 11, fontWeight: "800" },
  errorCard: { backgroundColor: "#F8E3DD", borderRadius: radii.control, padding: spacing.sm, marginTop: spacing.md },
  errorTitle: { color: colors.coral, fontSize: 12, fontWeight: "900" },
  errorCopy: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: 3 },
  progressBlock: { marginTop: 19 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  progressLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  progressValue: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  track: { height: 10, borderRadius: radii.pill, backgroundColor: colors.cream, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.coral },
  afterText: { color: colors.muted, fontSize: 11, marginTop: 7 },
  confirm: { minHeight: 52, borderRadius: radii.control, backgroundColor: colors.ink, justifyContent: "center", alignItems: "center", marginTop: spacing.lg },
  confirmText: { color: colors.white, fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
});
