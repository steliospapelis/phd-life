import type { Achievement, Friend, Milestone, PlayerState, SocialEvent, SocialReaction, Task, TaskLog, Title } from "@/src/types/models";

export type RewardBundle = {
  xpGained: number;
  previousLevel: number;
  currentLevel: number;
  levelUp: boolean;
  unlockedTitles: Title[];
  unlockedAchievements: Achievement[];
  achievementXpAwarded?: number;
  completedMilestone?: { id: string; title: string };
  milestoneRewards?: { titles: Title[]; achievement?: Achievement };
};

export function emptyRewardBundle(previousLevel = 1, currentLevel = previousLevel): RewardBundle {
  return { xpGained: 0, previousLevel, currentLevel, levelUp: currentLevel > previousLevel, unlockedTitles: [], unlockedAchievements: [] };
}

type ProgressContext = {
  friends?: Friend[];
  socialEvents?: SocialEvent[];
  socialReactions?: Record<string, SocialReaction | null>;
  profileId?: string;
};

export function getRuleProgress(rule: Record<string, unknown> | undefined, logs: TaskLog[], tasks: Task[], player: PlayerState, milestones: Milestone[], achievements: Achievement[], context: ProgressContext = {}): { current: number; target: number; unlocked: boolean } {
  const type = typeof rule?.type === "string" ? rule.type : "total_tasks";
  const target = Math.max(1, Number(rule?.count ?? rule?.level ?? 1));
  const loggedTasks = logs.map((log) => tasks.find((task) => task.id === log.taskId)).filter((task): task is Task => Boolean(task));
  let current = 0;
  if (type === "tag_count") {
    const tag = String(rule?.tag ?? "");
    current = loggedTasks.filter((task) => task.tags?.includes(tag) || task.categoryId === tag || task.name.toLowerCase().includes(tag.replaceAll("_", " "))).length;
  } else if (type === "total_tasks") current = logs.length;
  else if (type === "task_count") {
    const taskSlug = String(rule?.taskSlug ?? "");
    current = loggedTasks.filter((task) => task.id === taskSlug).length;
  } else if (type === "task_set_count") {
    const taskSlugs = Array.isArray(rule?.taskSlugs) ? rule.taskSlugs.map(String) : [];
    current = loggedTasks.filter((task) => taskSlugs.includes(task.id)).length;
  } else if (type === "total_xp") current = player.totalXp;
  else if (type === "streak_days") {
    const dates = [...new Set(logs.map((log) => log.occurredAt.slice(0, 10)))].sort();
    let longest = 0;
    let run = 0;
    let previous: number | null = null;
    dates.forEach((date) => {
      const day = Date.parse(`${date}T00:00:00Z`);
      if (previous !== null && day - previous === 86_400_000) run += 1;
      else run = 1;
      longest = Math.max(longest, run);
      previous = day;
    });
    current = longest;
  } else if (type === "friend_count") current = context.friends?.length ?? 0;
  else if (type === "citation_given") {
    current = (context.socialEvents ?? []).filter((event) => event.userHasCitation || context.socialReactions?.[event.id] === "citation").length;
  } else if (type === "citation_received") {
    const receivedFrom = new Set<string>();
    (context.socialEvents ?? []).filter((event) => event.userId === context.profileId).forEach((event) => (event.citationUsers ?? []).forEach((user) => receivedFrom.add(user.id)));
    current = receivedFrom.size;
  }
  else if (type === "distinct_categories") current = new Set(loggedTasks.map((task) => task.categoryId)).size;
  else if (type === "active_days") current = new Set(logs.map((log) => log.occurredAt.slice(0, 10))).size;
  else if (type === "level") current = player.level;
  else if (type === "achievement_count") current = achievements.filter((achievement) => achievement.unlocked).length;
  else if (type === "milestone") current = milestones.some((milestone) => milestone.id === rule?.milestoneId && milestone.completed) ? 1 : 0;
  else if (type === "all") {
    const rules = Array.isArray(rule?.rules) ? rule.rules as Record<string, unknown>[] : [];
    const childProgress = rules.map((child) => getRuleProgress(child, logs, tasks, player, milestones, achievements, context));
    const compoundTarget = Math.max(1, ...childProgress.map((child) => child.target));
    current = Math.min(compoundTarget, ...(childProgress.length > 0 ? childProgress.map((child) => child.current) : [0]));
    return { current, target: compoundTarget, unlocked: childProgress.every((child) => child.unlocked) };
  }
  return { current, target, unlocked: current >= target };
}

export function mergeUniqueTitles(...groups: Title[][]): Title[] {
  const seen = new Set<string>();
  return groups.flat().filter((title) => { if (seen.has(title.id)) return false; seen.add(title.id); return true; });
}

export function evaluateLocalRewards({ achievements, titles, logs, tasks, milestones, player, previousLevel, friends, socialEvents, socialReactions, profileId }: { achievements: Achievement[]; titles: Title[]; logs: TaskLog[]; tasks: Task[]; milestones: Milestone[]; player: PlayerState; previousLevel: number; friends?: Friend[]; socialEvents?: SocialEvent[]; socialReactions?: Record<string, SocialReaction | null>; profileId?: string }): { achievements: Achievement[]; titles: Title[]; unlockedAchievements: Achievement[]; unlockedTitles: Title[]; achievementXpAwarded: number } {
  const context = { friends, socialEvents, socialReactions, profileId };
  const newlyUnlockedAchievements = achievements.filter((achievement) => !achievement.unlocked && getRuleProgress(achievement.ruleConfig, logs, tasks, player, milestones, achievements, context).unlocked).map((achievement) => ({ ...achievement, unlocked: true, unlockedAt: new Date().toISOString() }));
  const nextAchievements = achievements.map((achievement) => newlyUnlockedAchievements.some((item) => item.id === achievement.id) ? { ...achievement, unlocked: true, unlockedAt: newlyUnlockedAchievements.find((item) => item.id === achievement.id)?.unlockedAt } : achievement);
  const levelTitles = titles.filter((title) => title.source === "level" && title.requiredLevel !== null && title.requiredLevel !== undefined && title.requiredLevel > previousLevel && title.requiredLevel <= player.level && !title.unlocked);
  const achievementTitles = newlyUnlockedAchievements.flatMap((achievement) => titles.filter((title) => title.source === "achievement" && title.achievementId === achievement.id && !title.unlocked));
  const newlyUnlockedTitles = mergeUniqueTitles(levelTitles, achievementTitles).map((title) => ({ ...title, unlocked: true, unlockedAt: new Date().toISOString() }));
  const nextTitles = titles.map((title) => newlyUnlockedTitles.some((item) => item.id === title.id) ? { ...title, unlocked: true, unlockedAt: newlyUnlockedTitles.find((item) => item.id === title.id)?.unlockedAt } : title);
  const achievementXpAwarded = newlyUnlockedAchievements.reduce((total, achievement) => total + (achievement.xpReward ?? 20), 0);
  return { achievements: nextAchievements, titles: nextTitles, unlockedAchievements: newlyUnlockedAchievements, unlockedTitles: newlyUnlockedTitles, achievementXpAwarded };
}
