import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Chip } from "@/src/components/ui/Chip";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { TaskLogSheet } from "@/src/components/tasks/TaskLogSheet";
import { TaskRow } from "@/src/components/tasks/TaskRow";
import { RewardSummarySheet } from "@/src/components/game/RewardSummarySheet";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { isSupabaseConfigured } from "@/src/config/app";
import { completeTaskFlow } from "@/src/services/taskCompletion";
import { loadRemotePlayerState, loadRemoteProgressionData } from "@/src/services/contentService";
import { loadRemoteTaskLogs } from "@/src/services/gameService";
import { useAuth } from "@/src/hooks/useAuth";
import { useAppStore } from "@/src/store/useAppStore";
import { ScrollablePanel } from "@/src/components/ui/ScrollablePanel";
import type { Task, TaskCompletionResult } from "@/src/types/models";

export function TaskBrowser() {
  const { height } = useWindowDimensions();
  const { player, categories, tasks, taskLogs, completeTask, recordTaskLog, applyPlayer, hydrateProgressionData, hydrateTaskLogs } = useAppStore();
  const { sessionExists } = useAuth();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const initialCategory = typeof categoryParam === "string" ? categoryParam : "all";
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [celebration, setCelebration] = useState<TaskCompletionResult | null>(null);
  const [reward, setReward] = useState<TaskCompletionResult | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  const visibleTasks = useMemo(() => tasks.filter((task) => (category === "all" || task.categoryId === category) && task.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.xpReward - b.xpReward || a.name.localeCompare(b.name)), [tasks, category, query]);
  const taskGroups = useMemo(() => categories.map((item) => ({ category: item, tasks: visibleTasks.filter((task) => task.categoryId === item.id) })).filter((group) => group.tasks.length > 0), [categories, visibleTasks]);
  const recentTasks = useMemo(() => { const seen = new Set<string>(); return taskLogs.slice().reverse().map((log) => tasks.find((task) => task.id === log.taskId)).filter((task): task is Task => Boolean(task)).filter((task) => { if (seen.has(task.id)) return false; seen.add(task.id); return true; }).slice(0, 4); }, [taskLogs, tasks]);

  useEffect(() => { if (!celebration) return; const timer = setTimeout(() => setCelebration(null), 1800); return () => clearTimeout(timer); }, [celebration]);

  function openTask(task: Task) { if (pending) return; setTaskError(null); setSelectedTask(task); }
  function closeTaskSheet() { if (pending) return; setTaskError(null); setSelectedTask(null); }

  async function confirmTask() {
    if (!selectedTask || pending) return;
    const task = selectedTask;
    setTaskError(null);
    setPending(task.id);
    try {
      const operationKey = `task-${task.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await completeTaskFlow({ task, sessionExists, currentPlayer: useAppStore.getState().player, completeLocalTask: completeTask, recordTaskLog, applyPlayer, operationKey });
      if (isSupabaseConfigured) {
        const [progression, freshPlayer, freshLogs] = await Promise.all([
          loadRemoteProgressionData().catch(() => null),
          loadRemotePlayerState().catch(() => null),
          loadRemoteTaskLogs().catch(() => null),
        ]);
        if (progression) hydrateProgressionData(progression.achievements, progression.titles);
        if (freshPlayer && freshPlayer.totalXp >= result.totalXp) applyPlayer(freshPlayer);
        if (freshLogs) hydrateTaskLogs(freshLogs);
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      await new Promise<void>((resolve) => setTimeout(resolve, 1200));
      setSelectedTask(null);
      if (result.levelUp || (result.unlockedTitles?.length ?? 0) > 0 || (result.unlockedAchievements?.length ?? 0) > 0 || result.completedMilestone || result.completedTask?.isMajor) setReward(result);
      else setCelebration(result);
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setPending(null);
    }
  }

  return <>
    <AppHeader title="Tasks" subtitle="What did you survive today?" />
    <TextInput value={query} onChangeText={setQuery} placeholder="Search tasks…" placeholderTextColor={colors.textSecondary} style={styles.search} accessibilityLabel="Search tasks" returnKeyType="search" />
    <View style={styles.chips}><Chip label="Everything" selected={category === "all"} onPress={() => setCategory("all")} />{categories.map((item) => <Chip key={item.id} label={`${item.iconKey} ${item.name}`} selected={category === item.id} onPress={() => setCategory(item.id)} />)}</View>
    <ScrollablePanel style={[styles.taskPanel, { maxHeight: Math.max(280, height - 360) }]} contentContainerStyle={styles.taskPanelContent}>
      {category === "all" && !query && recentTasks.length > 0 ? <View style={styles.recentSection}><View style={styles.categoryHeader}><View style={styles.categoryIcon}><Text>🕘</Text></View><Text style={styles.categoryName}>Recent</Text></View>{recentTasks.map((task) => <TaskRow key={`recent-${task.id}`} task={task} pending={pending === task.id} onPress={() => openTask(task)} />)}</View> : null}
      <View style={styles.taskList}>{taskGroups.map((group) => <View key={group.category.id} style={styles.categoryGroup}>
        {category === "all" ? <View style={styles.categoryHeader}><View style={styles.categoryIcon}><Text>{group.category.iconKey}</Text></View><Text style={styles.categoryName}>{group.category.name}</Text></View> : null}
        {group.tasks.map((task) => <TaskRow key={task.id} task={task} pending={pending === task.id} onPress={() => openTask(task)} />)}
      </View>)}</View>
      {visibleTasks.length === 0 ? <EmptyState title="No academic evidence found." message="Try another search. The bureaucracy is probably hiding nearby." icon={<Text style={styles.emptyIcon}>⌕</Text>} /> : null}
    </ScrollablePanel>
    {celebration ? <View accessibilityLiveRegion="polite" style={styles.toast}><View style={styles.toastIcon}><Text style={styles.toastIconText}>✓</Text></View><View><Text style={styles.toastLabel}>FIELD NOTE LOGGED</Text><Text style={styles.toastTitle}>+{celebration.xpAwarded} XP added</Text></View></View> : null}
    <TaskLogSheet task={selectedTask} player={player} error={taskError} busy={Boolean(pending)} onConfirm={() => void confirmTask()} onClose={closeTaskSheet} />
    <RewardSummarySheet reward={reward} onClose={() => setReward(null)} onViewTitles={() => { setReward(null); router.push({ pathname: "/profile", params: { openTitles: "1" } }); }} />
  </>;
}

const styles = StyleSheet.create({
  search: { minHeight: 48, borderRadius: radii.control, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.primary, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.xs, rowGap: spacing.xs, paddingBottom: spacing.xs, marginBottom: spacing.md },
  taskPanel: { borderWidth: 0, borderColor: "transparent", borderRadius: radii.card, backgroundColor: colors.background, padding: spacing.xs, marginBottom: spacing.md },
  taskPanelContent: { paddingBottom: spacing.xs, paddingRight: spacing.lg },
  taskList: { paddingBottom: spacing.sm },
  recentSection: { marginBottom: spacing.sm },
  categoryGroup: { marginBottom: spacing.sm },
  categoryHeader: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  categoryIcon: { width: 28, height: 28, borderRadius: radii.small, backgroundColor: colors.lavender, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  categoryName: { color: colors.primary, fontSize: typography.metadata, fontWeight: "900", flex: 1 },
  categoryCount: { color: colors.textSecondary, fontSize: typography.metadata, fontWeight: "800" },
  emptyIcon: { color: colors.accent, fontSize: 25 },
  toast: { flexDirection: "row", alignItems: "center", backgroundColor: colors.mint, borderRadius: radii.card, padding: spacing.sm, borderWidth: 1, borderColor: "#C9DDCD", marginTop: spacing.sm, marginBottom: spacing.md },
  toastIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  toastIconText: { color: colors.surface, fontSize: 17, fontWeight: "900" },
  toastLabel: { color: colors.success, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  toastTitle: { color: colors.primary, fontSize: typography.metadata + 1, fontWeight: "900", marginTop: 2 },
});
