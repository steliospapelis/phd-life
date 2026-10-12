import { isSupabaseConfigured } from "@/src/config/app";
import { supabase } from "@/src/lib/supabase/client";
import type { Friend, FriendRequest, SocialEvent } from "@/src/types/models";

export type SocialBootstrap = { friends: Friend[]; requests: FriendRequest[]; events: SocialEvent[]; nextCursor?: string | null };

export async function loadRemoteSocialBootstrap(before?: string | null): Promise<SocialBootstrap | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_social_bootstrap", { p_limit: 15, p_before: before ?? null });
  if (error) throw error;
  const payload = data as { friends?: Friend[]; requests?: FriendRequest[]; events?: SocialEvent[]; nextCursor?: string | null };
  return { friends: payload.friends ?? [], requests: payload.requests ?? [], events: payload.events ?? [], nextCursor: payload.nextCursor };
}

export async function searchRemoteUsers(username: string): Promise<Friend[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc("search_users_by_username", { p_query: username });
  if (error) throw error;
  return (data as { user_id: string; username: string; avatar: Friend["avatar"]; selected_title: string; phd_year: number; level: number; friendship_status: Friend["friendshipStatus"] }[]).map((item) => ({ id: item.user_id, username: item.username, title: item.selected_title, phdYear: item.phd_year, level: item.level, avatar: item.avatar, achievementNames: [], milestoneNames: [], friendsSince: "", friendshipStatus: item.friendship_status }));
}

export async function sendFriendRequestRemote(friendId: string) { if (isSupabaseConfigured && supabase) { const { error } = await supabase.rpc("send_friend_request", { p_addressee_id: friendId }); if (error) throw error; } }
export async function respondToFriendRequestRemote(requestId: string, accept: boolean) { if (isSupabaseConfigured && supabase) { const { error } = await supabase.rpc("respond_to_friend_request", { p_friendship_id: requestId, p_accept: accept }); if (error) throw error; } }
export async function removeFriendRemote(friendId: string) { if (isSupabaseConfigured && supabase) { const { error } = await supabase.rpc("remove_friend", { p_friend_id: friendId }); if (error) throw error; } }
export async function toggleLabCitationRemote(activityId: string) { if (isSupabaseConfigured && supabase) { const { data, error } = await supabase.rpc("toggle_lab_citation", { p_activity_id: activityId }); if (error) throw error; return data as { active: boolean; count: number; achievementXpAwarded?: number; totalXp?: number; level?: number }; } return null; }
export async function shareMilestoneRemote(milestoneId: string) { if (isSupabaseConfigured && supabase) { const { data, error } = await supabase.rpc("share_milestone", { p_milestone_id: milestoneId }); if (error) throw error; return data as { shared: boolean; activityId?: string }; } return { shared: true }; }
export async function shareAchievementRemote(achievementId: string) { if (isSupabaseConfigured && supabase) { const { data, error } = await supabase.rpc("share_achievement", { p_achievement_id: achievementId }); if (error) throw error; return data as { shared: boolean; activityId?: string }; } return { shared: true }; }
export async function shareTaskRemote(taskId: string) { if (isSupabaseConfigured && supabase) { const { data, error } = await supabase.rpc("share_task", { p_task_id: taskId }); if (error) throw error; return data as { shared: boolean; activityId?: string }; } return { shared: true }; }
