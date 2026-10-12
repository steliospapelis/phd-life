import { describe, expect, it } from "vitest";
import { buildActivityReport, getReportBounds } from "@/src/domain/reports";
import type { TaskLog } from "@/src/types/models";

const log = (id: string, taskId: string, taskName: string, categoryId: string, categoryName: string, xpAwarded: number, occurredAt: string): TaskLog => ({ id, taskId, taskName, categoryId, categoryName, xpAwarded, occurredAt });

describe("activity reports", () => {
  it("uses Monday as the start of a weekly report", () => {
    const { start, end } = getReportBounds("week", new Date(2026, 8, 9));
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 8, 7]);
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2026, 8, 14]);
  });

  it("aggregates task and category counts without touching sanity", () => {
    const logs = [
      log("paper-1", "read-paper", "Read a paper", "reading", "Reading", 10, "2026-09-07T09:00:00.000Z"),
      log("paper-2", "read-paper", "Read a paper", "reading", "Reading", 10, "2026-09-08T09:00:00.000Z"),
      log("test-1", "write-test", "Write a unit test", "coding", "Coding", 18, "2026-09-08T10:00:00.000Z"),
      log("old", "read-paper", "Read a paper", "reading", "Reading", 18, "2026-08-31T10:00:00.000Z"),
    ];
    const report = buildActivityReport(logs, "week", new Date(2026, 8, 9));
    expect(report).toMatchObject({ totalTasks: 3, totalXp: 38 });
    expect(report.taskBreakdown[0]).toMatchObject({ taskName: "Read a paper", count: 2, xp: 20 });
    expect(report.categoryBreakdown[0]).toMatchObject({ categoryName: "Reading", count: 2 });
  });
});
