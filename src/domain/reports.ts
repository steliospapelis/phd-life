import type { TaskLog } from "@/src/types/models";

export type ReportPeriod = "week" | "month" | "year";
export type ReportTaskBreakdown = { taskId: string; taskName: string; categoryName: string; count: number; xp: number };
export type ReportCategoryBreakdown = { categoryId: string; categoryName: string; count: number; xp: number };
export type ActivityReport = { period: ReportPeriod; startDate: string; endDate: string; totalTasks: number; totalXp: number; taskBreakdown: ReportTaskBreakdown[]; categoryBreakdown: ReportCategoryBreakdown[] };

export function getReportBounds(period: ReportPeriod, date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const mondayOffset = start.getDay() === 0 ? -6 : 1 - start.getDay();
    start.setDate(start.getDate() + mondayOffset);
  } else if (period === "month") {
    start.setDate(1);
  } else {
    start.setMonth(0, 1);
  }
  const end = new Date(start);
  if (period === "week") end.setDate(end.getDate() + 7);
  if (period === "month") end.setMonth(end.getMonth() + 1);
  if (period === "year") end.setFullYear(end.getFullYear() + 1);
  return { start, end };
}

function dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export function buildActivityReport(logs: TaskLog[], period: ReportPeriod, date = new Date()): ActivityReport {
  const { start, end } = getReportBounds(period, date);
  const taskMap = new Map<string, ReportTaskBreakdown>();
  const categoryMap = new Map<string, ReportCategoryBreakdown>();
  let totalXp = 0;
  let totalTasks = 0;

  logs.forEach((log) => {
    const occurredAt = new Date(log.occurredAt);
    if (Number.isNaN(occurredAt.getTime()) || occurredAt < start || occurredAt >= end) return;
    totalTasks += 1;
    totalXp += log.xpAwarded;
    const task = taskMap.get(log.taskId) ?? { taskId: log.taskId, taskName: log.taskName, categoryName: log.categoryName, count: 0, xp: 0 };
    task.count += 1;
    task.xp += log.xpAwarded;
    taskMap.set(log.taskId, task);
    const category = categoryMap.get(log.categoryId) ?? { categoryId: log.categoryId, categoryName: log.categoryName, count: 0, xp: 0 };
    category.count += 1;
    category.xp += log.xpAwarded;
    categoryMap.set(log.categoryId, category);
  });

  const byCount = <T extends { count: number; xp: number }>(a: T, b: T) => b.count - a.count || b.xp - a.xp;
  return { period, startDate: dateKey(start), endDate: dateKey(new Date(end.getTime() - 1)), totalTasks, totalXp, taskBreakdown: [...taskMap.values()].sort(byCount), categoryBreakdown: [...categoryMap.values()].sort(byCount) };
}
