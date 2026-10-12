import type { Milestone, SanityMood } from "@/src/types/models";

export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900];

export type SanityStateKey = "academic_damage" | "running_on_fumes" | "questionable" | "holding_it_together" | "surprisingly_functional" | "thriving_somehow" | "suspiciously_well";
export type SanityState = { key: SanityStateKey; label: string; min: number; max: number };

export const SANITY_STATES: SanityState[] = [
  { key: "academic_damage", label: "Academic Damage", min: 0, max: 14 },
  { key: "running_on_fumes", label: "Running on Fumes", min: 15, max: 29 },
  { key: "questionable", label: "Questionable", min: 30, max: 44 },
  { key: "holding_it_together", label: "Holding It Together", min: 45, max: 59 },
  { key: "surprisingly_functional", label: "Surprisingly Functional", min: 60, max: 74 },
  { key: "thriving_somehow", label: "Thriving, Somehow", min: 75, max: 89 },
  { key: "suspiciously_well", label: "Suspiciously Well", min: 90, max: 100 },
];

export function getLevelForXp(totalXp: number): number {
  return LEVEL_THRESHOLDS.reduce((level, threshold, index) => (totalXp >= threshold ? index + 1 : level), 1);
}

export function getXpProgress(totalXp: number) {
  const level = getLevelForXp(totalXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? LEVEL_THRESHOLDS.at(-1) ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 1000;
  const intoLevel = Math.max(0, totalXp - currentThreshold);
  const required = Math.max(1, nextThreshold - currentThreshold);
  return { level, currentThreshold, nextThreshold, intoLevel, required, percentage: Math.min(1, intoLevel / required) };
}

export function getPhdProgress(milestones: Milestone[]) {
  const journeyMilestones = milestones.filter((milestone) => milestone.isCoreJourney !== false);
  const totalWeight = journeyMilestones.reduce((sum, milestone) => sum + milestone.weight, 0);
  const completedWeight = journeyMilestones.filter((milestone) => milestone.completed).reduce((sum, milestone) => sum + milestone.weight, 0);
  return totalWeight === 0 ? 0 : Math.min(100, Math.round((completedWeight / totalWeight) * 100));
}

export function getSanityMood(sanity: number): SanityMood {
  const key = getSanityState(sanity).key;
  if (key === "suspiciously_well") return "energized";
  if (key === "thriving_somehow" || key === "surprisingly_functional") return "okay";
  if (key === "holding_it_together" || key === "questionable") return "tired";
  if (key === "running_on_fumes") return "frazzled";
  return "destroyed";
}

export function getSanityState(value: number): SanityState {
  const sanity = clampSanity(value);
  return SANITY_STATES.find((state) => sanity >= state.min && sanity <= state.max) ?? SANITY_STATES[0];
}

export function clampSanity(sanity: number) {
  if (!Number.isFinite(sanity)) return 0;
  return Math.round(Math.max(0, Math.min(100, sanity)));
}
