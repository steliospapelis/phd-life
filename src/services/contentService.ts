import { isSupabaseConfigured } from "@/src/config/app";
import { defaultAvatar } from "@/src/config/avatarDefaults";
import { getXpProgress } from "@/src/domain/game";
import { supabase } from "@/src/lib/supabase/client";
import type { Achievement, AvatarConfig, Milestone, PlayerState, Profile, Task, TaskCategory, Title } from "@/src/types/models";
import { loadStoredAvatar } from "@/src/services/avatarStorage";

type DbCategory = { id: string; slug: string; name: string; icon_key: string; sort_order: number };
type DbTask = { id: string; category_id: string; name: string; description: string | null; xp_reward: number; sanity_delta: number; icon_key: string; is_major: boolean; task_categories: { name: string } | { name: string }[] | null };
type DbState = { total_xp: number; sanity: number };

export async function loadRemotePlayerState(): Promise<PlayerState | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("player_state").select("total_xp, sanity").single();
  if (error) throw error;
  const state = data as DbState;
  return { totalXp: state.total_xp, sanity: state.sanity, level: getXpProgress(state.total_xp).level };
}

function normalizeAvatar(value: unknown): AvatarConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...defaultAvatar };

  const candidate = value as Partial<AvatarConfig>;
  return {
    ...defaultAvatar,
    ...candidate,
    accessory: typeof candidate.accessory === "string" || candidate.accessory === null ? candidate.accessory : defaultAvatar.accessory,
  };
}

function hasMeaningfulAvatar(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<AvatarConfig>;
  return Object.entries(defaultAvatar).some(([key, defaultValue]) => {
    const selectedValue = candidate[key as keyof AvatarConfig];
    return selectedValue !== undefined && selectedValue !== defaultValue;
  });
}

export async function loadRemoteHomeData(): Promise<{ tasks: Task[]; categories: TaskCategory[]; player: PlayerState } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const [categoriesResponse, tasksResponse, stateResponse] = await Promise.all([
    supabase.from("task_categories").select("id, slug, name, icon_key, sort_order").eq("active", true).order("sort_order"),
    supabase.from("tasks").select("id, category_id, name, description, xp_reward, sanity_delta, icon_key, is_major, task_categories(name)").eq("active", true).order("sort_order"),
    supabase.from("player_state").select("total_xp, sanity").single(),
  ]);
  if (categoriesResponse.error || tasksResponse.error || stateResponse.error) throw categoriesResponse.error ?? tasksResponse.error ?? stateResponse.error;
  const categories = (categoriesResponse.data as DbCategory[]).map((item) => ({ id: item.id, slug: item.slug, name: item.name, iconKey: item.icon_key, sortOrder: item.sort_order }));
  const tasks = (tasksResponse.data as DbTask[]).map((item) => { const relation = Array.isArray(item.task_categories) ? item.task_categories[0] : item.task_categories; return { id: item.id, categoryId: item.category_id, categoryName: relation?.name ?? "Other", name: item.name, description: item.description ?? undefined, xpReward: item.xp_reward, sanityDelta: item.sanity_delta, iconKey: item.icon_key, isMajor: item.is_major }; });
  const state = stateResponse.data as DbState;
  return { tasks, categories, player: { totalXp: state.total_xp, sanity: state.sanity, level: 1 } };
}

export async function loadRemoteProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("No active session while loading the profile.");

  // Keep this best-effort so the app remains compatible until migration 0022 is applied.
  try { await supabase.rpc("sync_phd_year"); } catch { /* migration not applied yet */ }

  const { data, error } = await supabase.from("profiles").select("id, username, phd_year, timezone, onboarding_complete, avatar, titles!profiles_selected_title_fk(name)").eq("id", authData.user.id).single();
  if (error) throw error;
  const row = data as { id: string; username: string; phd_year: number; timezone: string; onboarding_complete: boolean; avatar: Profile["avatar"]; titles: { name: string } | { name: string }[] | null };
  const title = Array.isArray(row.titles) ? row.titles[0]?.name : row.titles?.name;
  const storedAvatar = await loadStoredAvatar(row.id);
  const avatar = storedAvatar && !hasMeaningfulAvatar(row.avatar) ? normalizeAvatar(storedAvatar) : normalizeAvatar(row.avatar);
  return { id: row.id, username: row.username, phdYear: row.phd_year, selectedTitle: title ?? "Promising Research Organism", timezone: row.timezone, onboardingComplete: row.onboarding_complete, avatar };
}

export async function loadRemoteOnboardingComplete(): Promise<boolean | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("profiles").select("onboarding_complete").single();
  if (error) throw error;
  return Boolean((data as { onboarding_complete: boolean }).onboarding_complete);
}

type ProgressionSnapshot = {
  titles?: { id: string; slug?: string; name: string; source?: "level" | "milestone" | "achievement"; requiredLevel?: number | null; milestoneId?: string | null; achievementId?: string | null; unlocked?: boolean; unlockedAt?: string | null }[];
  achievements?: { id: string; slug: string; name: string; description: string; category?: string; ruleType?: Achievement["ruleType"]; ruleConfig?: Record<string, unknown>; badgeKey?: string; iconKey?: string; rarity?: string; xpReward?: number; hidden?: boolean; unlocked?: boolean; unlockedAt?: string | null; progressCurrent?: number; progressTarget?: number; titleRewardId?: string | null }[];
};

export async function loadRemoteProgressionData(): Promise<{ achievements: Achievement[]; titles: Title[] } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_progression_snapshot");
  if (error) throw error;
  const snapshot = data as ProgressionSnapshot;
  const titles = (snapshot.titles ?? []).map((item) => ({ id: item.id, slug: item.slug, name: item.name, source: item.source, unlockLevel: item.requiredLevel ?? null, requiredLevel: item.requiredLevel ?? null, milestoneId: item.milestoneId ?? null, achievementId: item.achievementId ?? null, unlocked: Boolean(item.unlocked), unlockedAt: item.unlockedAt ?? null }));
  const achievements = (snapshot.achievements ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, iconKey: item.iconKey ?? item.badgeKey ?? "✦", badgeKey: item.badgeKey, category: item.category, ruleType: item.ruleType, ruleConfig: item.ruleConfig, hidden: item.hidden, progressCurrent: item.progressCurrent, progressTarget: item.progressTarget, xpReward: item.xpReward ?? 20, titleRewardId: item.titleRewardId, rarity: item.rarity ?? "common", unlocked: Boolean(item.unlocked), unlockedAt: item.unlockedAt ?? null }));
  return { achievements, titles };
}

type JourneySnapshot = {
  milestones?: { id: string; slug?: string; title: string; description: string; iconKey?: string; progressPercent?: number; xpReward?: number; isAutomatic?: boolean; isCoreJourney?: boolean; completed?: boolean }[];
};

export async function loadRemoteMilestones(): Promise<Milestone[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_journey_snapshot");
  if (error) throw error;
  const snapshot = data as JourneySnapshot;
  return (snapshot.milestones ?? []).map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    iconKey: item.iconKey ?? "✦",
    weight: item.progressPercent ?? 0,
    xpReward: item.xpReward ?? 0,
    isAutomatic: Boolean(item.isAutomatic),
    isCoreJourney: item.isCoreJourney !== false,
    completed: Boolean(item.completed),
  }));
}
