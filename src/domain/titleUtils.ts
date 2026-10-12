import type { Title } from "@/src/types/models";

export function isTitleUnlocked(title: Title, level: number) {
  return title.unlocked ?? (title.source === "level" && (title.requiredLevel ?? title.unlockLevel ?? 999) <= level);
}

export function titleRequirement(title: Title) {
  if (title.source === "level") return "Unlocked at Level " + (title.requiredLevel ?? title.unlockLevel ?? "?");
  if (title.source === "milestone") return "Complete the related milestone";
  if (title.source === "achievement") return "Unlock the related achievement";
  return "Keep completing research tasks";
}

export function sortTitles(titles: Title[], selectedTitle: string, level: number) {
  return [...titles].sort((a, b) => {
    const rank = (title: Title) => isTitleUnlocked(title, level) ? (title.name === selectedTitle ? 0 : 1) : 2;
    return rank(a) - rank(b) || (a.requiredLevel ?? a.unlockLevel ?? 999) - (b.requiredLevel ?? b.unlockLevel ?? 999) || a.name.localeCompare(b.name);
  });
}
