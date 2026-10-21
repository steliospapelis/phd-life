import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScrollablePanel } from "@/src/components/ui/ScrollablePanel";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import type { ActivityReport, ReportPeriod } from "@/src/domain/reports";

export function ActivityReportSheet({ visible, report, reportPeriod, onPeriodChange, onClose }: { visible: boolean; report: ActivityReport; reportPeriod: ReportPeriod; onPeriodChange: (period: ReportPeriod) => void; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}><Pressable accessibilityLabel="Close activity report" style={styles.dismissArea} onPress={onClose} />
      <SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}><Pressable accessibilityRole="button" accessibilityLabel="Close activity report" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.sheetTitle}>Activity Report</Text>
          <Text style={styles.subtitle}>The academic damage, itemized.</Text>
          <View style={styles.periodTabs}>{(["week", "month", "year"] as ReportPeriod[]).map((period) => <Pressable accessibilityRole="button" accessibilityState={{ selected: reportPeriod === period }} key={period} onPress={() => onPeriodChange(period)} style={[styles.periodTab, reportPeriod === period && styles.periodTabSelected]}><Text style={[styles.periodText, reportPeriod === period && styles.periodTextSelected]}>{period === "week" ? "This week" : period === "month" ? "This month" : "This year"}</Text></Pressable>)}</View>
          <View style={styles.summary}><View><Text style={styles.summaryValue}>{report.totalTasks}</Text><Text style={styles.summaryLabel}>TASKS LOGGED</Text></View><View style={styles.summaryDivider} /><View><Text style={styles.summaryValue}>{report.totalXp}</Text><Text style={styles.summaryLabel}>XP EARNED</Text></View></View>
          <ScrollablePanel style={styles.reportScroll} contentContainerStyle={styles.reportScrollContent}>
            {report.taskBreakdown.length === 0 ? <EmptyState title="No field notes yet." message="Log a task and your progress will show up here." icon={<Text style={styles.emptyIcon}>✎</Text>} /> : <View style={styles.reportList}>{report.taskBreakdown.map((item) => <View style={styles.reportRow} key={item.taskId}><View style={styles.reportTaskCopy}><Text style={styles.reportTaskName}>{item.taskName}</Text><Text style={styles.reportTaskCategory}>{item.categoryName}  ·  {item.xp} XP</Text></View><View style={styles.reportCount}><Text style={styles.reportCountValue}>{item.count}×</Text><Text style={styles.reportCountLabel}>DONE</Text></View></View>)}</View>}
            {report.categoryBreakdown.length > 0 ? <View style={styles.categorySummary}><Text style={styles.categorySummaryLabel}>BY CATEGORY</Text><View style={styles.categoryPills}>{report.categoryBreakdown.map((item) => <View style={styles.categoryPill} key={item.categoryId}><Text style={styles.categoryPillText}>{item.categoryName}  {item.count}</Text></View>)}</View></View> : null}
          </ScrollablePanel>
        </View>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(23, 52, 92, 0.42)", justifyContent: "flex-end" },
  dismissArea: { flex: 1 },
  sheet: { height: "92%", backgroundColor: colors.background, borderTopLeftRadius: radii.hero, borderTopRightRadius: radii.hero, overflow: "hidden" },
  sheetContent: { flex: 1, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHeader: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  close: { width: 35, height: 35, borderRadius: radii.control, backgroundColor: colors.cream, justifyContent: "center", alignItems: "center" },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 27, fontWeight: "300" },
  sheetTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 28 },
  subtitle: { color: colors.muted, lineHeight: 20, marginTop: 5, marginBottom: spacing.md },
  periodTabs: { flexDirection: "row", minHeight: 42, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.control, padding: spacing.xs, marginBottom: spacing.md },
  periodTab: { flex: 1, minHeight: 34, borderRadius: radii.control - 3, justifyContent: "center", alignItems: "center" },
  periodTabSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  periodText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  periodTextSelected: { color: colors.ink },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: spacing.md, marginBottom: spacing.md },
  summaryDivider: { width: 1, height: 30, backgroundColor: colors.line },
  summaryValue: { color: colors.ink, fontFamily: typography.display, fontSize: 24, textAlign: "center" },
  summaryLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.6, textAlign: "center", marginTop: 3 },
  reportScroll: { flex: 1, minHeight: 0 },
  reportScrollContent: { paddingRight: spacing.xl, paddingBottom: spacing.xs },
  emptyIcon: { color: colors.coral, fontSize: 21 },
  reportList: { borderTopWidth: 1, borderTopColor: colors.line },
  reportRow: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reportTaskCopy: { flex: 1, paddingRight: spacing.md },
  reportTaskName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  reportTaskCategory: { color: colors.coral, fontSize: 9, marginTop: 2 },
  reportCount: { alignItems: "flex-end" },
  reportCountValue: { color: colors.secondary, fontFamily: typography.display, fontSize: 18 },
  reportCountLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  categorySummary: { paddingTop: spacing.md },
  categorySummaryLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  categoryPills: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: spacing.sm },
  categoryPill: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  categoryPillText: { color: colors.teal, fontSize: 10, fontWeight: "800" },
});
