import type { SocialEvent, SocialReaction } from "@/src/types/models";

export const SOCIAL_CITATION = { value: "citation" as SocialReaction, label: "Cite", selectedLabel: "Cited" } as const;
export const socialReactionOptions: { value: SocialReaction; label: string }[] = [{ value: SOCIAL_CITATION.value, label: SOCIAL_CITATION.label }];

export type SharedActivityCopy = { actionLabel: string; categoryLabel: string; categoryIcon: string; title: string; flavorText: string };

export function formatSharedActivity(event: SocialEvent): SharedActivityCopy {
  const achievement = event.type === "achievement" || event.type === "achievement_unlocked";
  const majorTask = event.type === "task";
  const title = String(event.metadata.title ?? event.metadata.achievementName ?? event.metadata.milestoneName ?? "Academic progress");
  const flavorText = String(event.metadata.flavorText ?? event.metadata.description ?? "Another academic plot twist handled.");
  return {
    actionLabel: achievement ? "unlocked an achievement" : "completed a milestone",
    categoryLabel: majorTask ? String(event.metadata.categoryName ?? "Major task") : achievement ? "Achievement" : "Milestone",
    categoryIcon: majorTask ? "⚡" : achievement ? "✦" : "🏁",
    title,
    flavorText,
  };
}

export function formatSocialEvent(event: SocialEvent) {
  switch (event.type) {
    case "achievement": return { primaryText: `${event.username} unlocked an achievement.`, secondaryText: String(event.metadata.title ?? "A new badge appeared."), icon: "🏅" };
    case "milestone": return { primaryText: `${event.username} completed a milestone.`, secondaryText: String(event.metadata.title ?? "One more plot twist handled."), icon: "✓" };
    case "task": return { primaryText: `${event.username} completed a major task.`, secondaryText: String(event.metadata.title ?? "A major research win has entered the record."), icon: "⚡" };
    case "level_up": return { primaryText: `${event.username} reached Level ${event.metadata.level ?? "?"}.`, secondaryText: "Apparently this counts as character development.", icon: "✦" };
    case "achievement_unlocked": return { primaryText: `${event.username} unlocked:`, secondaryText: String(event.metadata.achievementName ?? "a new achievement"), icon: "🏅" };
    case "milestone_completed": return { primaryText: `${event.username} completed ${event.metadata.milestoneName ?? "a PhD milestone"}.`, secondaryText: "One more plot twist handled.", icon: "✓" };
    case "paper_submitted": return { primaryText: `${event.username} submitted a paper.`, secondaryText: "It belongs to the reviewers now.", icon: "✉" };
    case "paper_accepted": return { primaryText: `${event.username}'s paper was accepted.`, secondaryText: "That one deserves a moment.", icon: "★" };
    case "conference_completed": return { primaryText: `${event.username} survived a conference.`, secondaryText: "Social battery status unknown.", icon: "⌁" };
    case "major_research_event": return { primaryText: `${event.username} made a major research breakthrough.`, secondaryText: "The data briefly cooperated.", icon: "⌁" };
    case "thesis_submitted": return { primaryText: `${event.username} submitted their thesis.`, secondaryText: "A very large document has entered the world.", icon: "📘" };
    case "defense_completed": return { primaryText: `${event.username} completed their defense.`, secondaryText: "Final boss defeated.", icon: "★" };
  }
}

export function formatRelativeTime(createdAt: string, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return "Yesterday";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
