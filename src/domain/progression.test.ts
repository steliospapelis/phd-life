import { describe, expect, it } from "vitest";
import { evaluateLocalRewards, getRuleProgress } from "@/src/domain/progression";
import type { Achievement, Milestone, PlayerState, Task, TaskLog, Title } from "@/src/types/models";

const tasks: Task[] = [
  { id: "paper", categoryId: "reading", categoryName: "Reading", name: "Read a paper", xpReward: 10, sanityDelta: 0, iconKey: "📚", isMajor: false, tags: ["reading", "paper_reading"] },
  { id: "email", categoryId: "admin", categoryName: "Admin", name: "Write an email", xpReward: 2, sanityDelta: 0, iconKey: "📧", isMajor: false, tags: ["admin", "email"] },
];
const log = (id: string, taskId: string, date: string): TaskLog => ({ id, taskId, taskName: taskId, categoryId: taskId === "paper" ? "reading" : "admin", categoryName: "", xpAwarded: 1, occurredAt: date });
const player: PlayerState = { totalXp: 450, level: 4, sanity: 70 };
const milestones: Milestone[] = [];

describe("progression rules", () => {
  it("counts semantic tags and ignores unrelated tags", () => {
    const logs = [log("1", "paper", "2026-10-01T10:00:00Z"), log("2", "email", "2026-10-01T11:00:00Z")];
    expect(getRuleProgress({ type: "tag_count", tag: "paper_reading", count: 1 }, logs, tasks, player, milestones, []).unlocked).toBe(true);
    expect(getRuleProgress({ type: "tag_count", tag: "coding", count: 1 }, logs, tasks, player, milestones, []).current).toBe(0);
  });

  it("counts active days as distinct dates, not a streak", () => {
    const logs = [log("1", "paper", "2026-10-01T10:00:00Z"), log("2", "email", "2026-10-01T11:00:00Z"), log("3", "paper", "2026-10-04T11:00:00Z")];
    expect(getRuleProgress({ type: "active_days", count: 2 }, logs, tasks, player, milestones, [])).toMatchObject({ current: 2, unlocked: true });
  });

  it("counts task-specific rules and consecutive-day streaks", () => {
    const logs = [log("1", "paper", "2026-10-01T10:00:00Z"), log("2", "paper", "2026-10-02T10:00:00Z"), log("3", "paper", "2026-10-03T10:00:00Z"), log("4", "email", "2026-10-06T10:00:00Z")];
    expect(getRuleProgress({ type: "task_count", taskSlug: "paper", count: 3 }, logs, tasks, player, milestones, [])).toMatchObject({ current: 3, target: 3, unlocked: true });
    expect(getRuleProgress({ type: "streak_days", count: 3 }, logs, tasks, player, milestones, [])).toMatchObject({ current: 3, target: 3, unlocked: true });
  });

  it("awards achievement XP only for newly unlocked achievements", () => {
    const achievement: Achievement = { id: "task-achievement", name: "Task achievement", description: "", iconKey: "✦", rarity: "common", xpReward: 40, unlocked: false, ruleConfig: { type: "task_count", taskSlug: "paper", count: 1 } };
    const result = evaluateLocalRewards({ achievements: [achievement], titles: [], logs: [log("1", "paper", "2026-10-01T10:00:00Z")], tasks, milestones, player, previousLevel: player.level });
    expect(result.achievementXpAwarded).toBe(40);
    expect(result.unlockedAchievements[0].xpReward).toBe(40);
  });

  it("evaluates compound all rules and unlocks level titles without equipping them", () => {
    const achievements: Achievement[] = [{ id: "compound", name: "Compound", description: "", iconKey: "✦", rarity: "common", unlocked: false, ruleType: "all", ruleConfig: { type: "all", rules: [{ type: "total_tasks", count: 1 }, { type: "tag_count", tag: "paper_reading", count: 1 }] } }];
    const titles: Title[] = [{ id: "title-5", name: "Compiler Whisperer", source: "level", unlockLevel: 5, requiredLevel: 5, unlocked: false }];
    const result = evaluateLocalRewards({ achievements, titles, logs: [log("1", "paper", "2026-10-01T10:00:00Z")], tasks, milestones, player: { ...player, level: 5 }, previousLevel: 4 });
    expect(result.unlockedAchievements.map((item) => item.id)).toEqual(["compound"]);
    expect(result.unlockedTitles.map((item) => item.name)).toEqual(["Compiler Whisperer"]);
    expect(result.titles[0].unlocked).toBe(true);
  });
});
