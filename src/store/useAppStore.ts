import { create } from "zustand";
import { demoData } from "@/src/lib/demo/data";
import { getLevelForXp } from "@/src/domain/game";
import { evaluateLocalRewards, getRuleProgress } from "@/src/domain/progression";
import type { Achievement, AppData, AvatarConfig, Friend, PlayerState, SocialCitationUser, SocialReaction, Task, TaskCategory, TaskCompletionResult, Title } from "@/src/types/models";

type AppStore = AppData & { demoSession: boolean; setDemoSession: (value: boolean) => void; completeOnboarding: (username: string, phdYear: number, avatar: AvatarConfig) => void; updateAvatar: (avatar: AvatarConfig) => void; completeTask: (taskId: string) => TaskCompletionResult; recordTaskLog: (task: Task, xpAwarded: number) => void; applyPlayer: (player: PlayerState) => void; hydrateProfile: (profile: AppData["profile"]) => void; hydrateTaskContent: (tasks: Task[], categories: TaskCategory[]) => void; hydrateTaskLogs: (taskLogs: AppData["taskLogs"]) => void; hydrateProgressionData: (achievements: Achievement[], titles: Title[]) => void; hydrateMilestones: (milestones: AppData["milestones"]) => void; hydrateSocialData: (friends: Friend[], friendRequests: AppData["friendRequests"], socialEvents: AppData["socialEvents"]) => void; appendSocialEvents: (socialEvents: AppData["socialEvents"]) => void; toggleMilestone: (id: string) => TaskCompletionResult | null; selectTitle: (title: string) => void; setSocialReaction: (eventId: string, reaction: SocialReaction | null) => void; updateSocialEventCitations: (eventId: string, count: number, userHasCitation: boolean, citationUsers?: SocialCitationUser[]) => void; acceptFriendRequest: (requestId: string) => void; declineFriendRequest: (requestId: string) => void; addFriend: (friend: Friend) => void; removeFriend: (friendId: string) => void; logout: () => void };

export const useAppStore = create<AppStore>((set, get) => ({
  ...demoData, demoSession: false,
  setDemoSession: (value) => set({ demoSession: value }),
  applyPlayer: (player) => set({ player }),
  hydrateProfile: (profile) => set({ profile }),
  hydrateTaskContent: (tasks, categories) => set({ tasks, categories }),
  hydrateTaskLogs: (taskLogs) => set({ taskLogs }),
  hydrateProgressionData: (achievements, titles) => set({ achievements, titles }),
  hydrateMilestones: (milestones) => set({ milestones }),
  hydrateSocialData: (friends, friendRequests, socialEvents) => set({ friends, friendRequests, socialEvents, socialReactions: Object.fromEntries(socialEvents.filter((event) => event.userHasCitation ?? event.userHasKudos).map((event) => [event.id, "citation"])) }),
  appendSocialEvents: (socialEvents) => set((state) => ({ socialEvents: [...state.socialEvents, ...socialEvents.filter((item) => !state.socialEvents.some((existing) => existing.id === item.id))] })),
  recordTaskLog: (task, xpAwarded) => set((state) => ({ taskLogs: [...state.taskLogs, { id: `local-log-${Date.now()}-${task.id}`, taskId: task.id, taskName: task.name, categoryId: task.categoryId, categoryName: task.categoryName, xpAwarded, occurredAt: new Date().toISOString() }] })),
  completeOnboarding: (username, phdYear, avatar) => set((state) => ({ profile: { ...state.profile, username: username.toUpperCase(), phdYear, avatar, onboardingComplete: true } })),
  updateAvatar: (avatar) => set((state) => ({ profile: { ...state.profile, avatar } })),
  completeTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error("Task not found");
    const before = state.player;
    const taskLog = { id: `local-log-${Date.now()}-${task.id}`, taskId: task.id, taskName: task.name, categoryId: task.categoryId, categoryName: task.categoryName, xpAwarded: task.xpReward, occurredAt: new Date().toISOString() };
    const nextLogs = [...state.taskLogs, taskLog];
    let nextPlayer = { totalXp: before.totalXp + task.xpReward, level: getLevelForXp(before.totalXp + task.xpReward), sanity: before.sanity };
    let nextAchievements = state.achievements;
    let nextTitles = state.titles;
    const unlockedAchievements: Achievement[] = [];
    const unlockedTitles: Title[] = [];
    let achievementXpAwarded = 0;
    for (let pass = 0; pass < 3; pass += 1) {
      const progression = evaluateLocalRewards({ achievements: nextAchievements, titles: nextTitles, logs: nextLogs, tasks: state.tasks, milestones: state.milestones, player: nextPlayer, previousLevel: before.level, friends: state.friends, socialEvents: state.socialEvents, socialReactions: state.socialReactions, profileId: state.profile.id });
      nextAchievements = progression.achievements;
      nextTitles = progression.titles;
      unlockedAchievements.push(...progression.unlockedAchievements);
      unlockedTitles.push(...progression.unlockedTitles);
      if (progression.achievementXpAwarded === 0) break;
      achievementXpAwarded += progression.achievementXpAwarded;
      const totalXp = nextPlayer.totalXp + progression.achievementXpAwarded;
      nextPlayer = { ...nextPlayer, totalXp, level: getLevelForXp(totalXp) };
    }
    nextAchievements = nextAchievements.map((achievement) => {
      const progress = getRuleProgress(achievement.ruleConfig, nextLogs, state.tasks, nextPlayer, state.milestones, nextAchievements, { friends: state.friends, socialEvents: state.socialEvents, socialReactions: state.socialReactions, profileId: state.profile.id });
      return { ...achievement, progressCurrent: progress.current, progressTarget: progress.target };
    });
    const result = { xpAwarded: task.xpReward, xpGained: task.xpReward + achievementXpAwarded, achievementXpAwarded, totalXp: nextPlayer.totalXp, level: nextPlayer.level, currentLevel: nextPlayer.level, previousLevel: before.level, sanity: nextPlayer.sanity, levelUp: nextPlayer.level > before.level, acknowledgement: task.isMajor ? "ACADEMIA HAS BEEN NOTIFIED" : "NICELY SURVIVED", unlockedTitles, unlockedAchievements };
    set({ player: nextPlayer, taskLogs: nextLogs, achievements: nextAchievements, titles: nextTitles });
    return result;
  },
  toggleMilestone: (id) => {
    const state = get();
    const milestone = state.milestones.find((item) => item.id === id);
    if (!milestone || milestone.completed || milestone.isAutomatic) return null;
    const totalXp = state.player.totalXp + milestone.xpReward;
    const nextPlayer = { ...state.player, totalXp, level: getLevelForXp(totalXp) };
    set({ milestones: state.milestones.map((item) => item.id === id ? { ...item, completed: true } : item), player: nextPlayer });
    return { xpAwarded: milestone.xpReward, xpGained: milestone.xpReward, totalXp, level: nextPlayer.level, currentLevel: nextPlayer.level, previousLevel: state.player.level, sanity: nextPlayer.sanity, levelUp: nextPlayer.level > state.player.level, acknowledgement: "MILESTONE COMPLETE", completedMilestone: { id: milestone.id, title: milestone.title }, unlockedTitles: [], unlockedAchievements: [] };
  },
  selectTitle: (title) => set((state) => ({ profile: { ...state.profile, selectedTitle: title } })),
  setSocialReaction: (eventId, reaction) => set((state) => ({ socialReactions: { ...state.socialReactions, [eventId]: reaction } })),
  updateSocialEventCitations: (eventId, count, userHasCitation, citationUsers) => set((state) => ({ socialEvents: state.socialEvents.map((event) => event.id === eventId ? { ...event, citationCount: count, userHasCitation, citationUsers: citationUsers ?? event.citationUsers, reactions: { ...event.reactions, citation: count } } : event) })),
  acceptFriendRequest: (requestId) => set((state) => { const request = state.friendRequests.find((item) => item.id === requestId); if (!request) return state; return { friendRequests: state.friendRequests.filter((item) => item.id !== requestId), friends: state.friends.some((item) => item.id === request.from.id) ? state.friends : [...state.friends, request.from] }; }),
  declineFriendRequest: (requestId) => set((state) => ({ friendRequests: state.friendRequests.filter((item) => item.id !== requestId) })),
  addFriend: (friend) => set((state) => ({ friends: state.friends.some((item) => item.id === friend.id) ? state.friends : [...state.friends, friend] })),
  removeFriend: (friendId) => set((state) => ({ friends: state.friends.filter((item) => item.id !== friendId), socialEvents: state.socialEvents.filter((item) => item.userId !== friendId) })),
  logout: () => set({ demoSession: false }),
}));
