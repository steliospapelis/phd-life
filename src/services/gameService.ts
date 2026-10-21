import { isSupabaseConfigured } from "@/src/config/app";
import { supabase } from "@/src/lib/supabase/client";
import type { ActivityReport, ReportPeriod } from "@/src/domain/reports";
import type { TaskLog } from "@/src/types/models";

export async function completeTaskRemote(taskId: string, operationKey?: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("complete_task", { p_task_id: taskId, ...(operationKey ? { p_operation_key: operationKey } : {}) });
  if (error) throw error;
  return data;
}

type DbTaskLog = { id: string; task_id: string; created_at: string; xp_awarded: number | null; tasks: { name: string; category_id: string; xp_reward: number; task_categories: { name: string } | { name: string }[] | null } | { name: string; category_id: string; xp_reward: number; task_categories: { name: string } | { name: string }[] | null }[] | null };

export async function loadRemoteTaskLogs(): Promise<TaskLog[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("task_logs").select("id, task_id, created_at, xp_awarded, tasks(name, category_id, xp_reward, task_categories(name))").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DbTaskLog[]).flatMap((item) => {
    const task = Array.isArray(item.tasks) ? item.tasks[0] : item.tasks;
    if (!task) return [];
    const relation = Array.isArray(task.task_categories) ? task.task_categories[0] : task.task_categories;
    return [{ id: item.id, taskId: item.task_id, taskName: task.name, categoryId: task.category_id, categoryName: relation?.name ?? "Other", xpAwarded: item.xp_awarded ?? task.xp_reward, occurredAt: item.created_at }];
  });
}

export async function loadRemoteActivityReport(period: ReportPeriod): Promise<ActivityReport | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_activity_report", { p_period: period });
  if (error) throw error;
  return data as ActivityReport;
}

export async function claimDailySurvivalRemote() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("claim_daily_survival");
  if (error) throw error;
  return data;
}

export async function updateSanityRemote(sanity: number) {
  if (!isSupabaseConfigured || !supabase) return sanity;
  const { data, error } = await supabase.rpc("set_sanity", { p_sanity: sanity });
  if (error) throw error;
  return Number((data as { sanity?: number } | null)?.sanity ?? sanity);
}

export async function updateProfileRemote(username: string, phdYear: number, avatar: unknown) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Your session is not active. Please sign in again and try saving your avatar.");

  // Treat the year selected during onboarding as the user's current year.
  // Resetting the sync date prevents the automatic September progression from
  // immediately applying elapsed time from the placeholder profile created at signup.
  const syncedOn = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("profiles")
    .update({ username, phd_year: phdYear, phd_year_last_synced_on: syncedOn, avatar, onboarding_complete: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    .eq("id", authData.user.id)
    .select("id, avatar")
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error("Your avatar could not be saved to your profile.");
}

export async function isUsernameAvailableRemote(username: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;
  const normalized = username.trim();
  const availability = await supabase.rpc("is_username_available", { p_username: normalized });
  if (!availability.error) return Boolean(availability.data);

  // Fall back to the existing search RPC while the availability migration is
  // being rolled out. The database unique index remains the final safeguard.
  const search = await supabase.rpc("search_users_by_username", { p_query: normalized });
  if (search.error) return true;
  const matches = (search.data as { username?: string }[] | null) ?? [];
  return !matches.some((item) => item.username?.toLowerCase() === normalized.toLowerCase());
}

export async function updateAvatarRemote(avatar: unknown) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Your session is not active. Please sign in again and try saving your avatar.");
  const { error } = await supabase.from("profiles").update({ avatar, updated_at: new Date().toISOString() }).eq("id", authData.user.id);
  if (error) throw error;
}

export async function setPhdYearRemote(phdYear: number) {
  if (!isSupabaseConfigured || !supabase) return phdYear;
  const { data, error } = await supabase.rpc("set_phd_year", { p_phd_year: phdYear });
  if (error) throw error;
  return Number((data as { phdYear?: number } | null)?.phdYear ?? phdYear);
}

export async function selectTitleRemote(titleName: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: title, error: titleError } = await supabase.from("titles").select("id").eq("name", titleName).single();
  if (titleError) throw titleError;
  const { error } = await supabase.rpc("select_title", { p_title_id: title.id });
  if (error) throw error;
}

export async function selectTitleRemoteById(titleId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.rpc("select_title", { p_title_id: titleId });
  if (error) throw error;
}

export async function toggleMilestoneRemote(milestoneId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data, error } = await supabase.rpc("toggle_milestone", { p_milestone_id: milestoneId });
  if (error) throw error;
  return data;
}
