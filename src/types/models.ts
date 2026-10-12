export type Presentation = "masculine" | "feminine" | "neutral";
export type SanityMood = "energized" | "okay" | "tired" | "frazzled" | "destroyed";

export type AvatarConfig = {
  presentation: Presentation;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessory: string | null;
  headId?: string;
  hairId?: string;
  eyesId?: string;
  mouthId?: string;
  backgroundColor?: string;
};

export type Profile = {
  id: string;
  username: string;
  phdYear: number;
  selectedTitle: string;
  timezone: string;
  onboardingComplete: boolean;
  avatar: AvatarConfig;
};

export type PlayerState = { totalXp: number; sanity: number; level: number };
export type TaskCategory = { id: string; slug: string; name: string; iconKey: string; sortOrder: number };
export type Task = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  xpReward: number;
  sanityDelta: number;
  iconKey: string;
  isMajor: boolean;
  tags?: string[];
};
export type TaskCompletionResult = {
  xpAwarded: number;
  totalXp: number;
  level: number;
  sanity: number;
  levelUp: boolean;
  acknowledgement: string;
  xpGained?: number;
  achievementXpAwarded?: number;
  previousLevel?: number;
  currentLevel?: number;
  unlockedTitles?: Title[];
  unlockedAchievements?: Achievement[];
  completedMilestone?: { id: string; title: string };
  completedTask?: { id: string; name: string; categoryName: string; xpReward: number; isMajor: boolean };
  milestoneRewards?: { titles: Title[]; achievement?: Achievement };
};
export type TitleSource = "level" | "milestone" | "achievement";
export type AchievementRuleType = "tag_count" | "total_tasks" | "distinct_categories" | "active_days" | "level" | "achievement_count" | "milestone" | "all" | "task_count" | "task_set_count" | "total_xp" | "streak_days" | "friend_count" | "citation_given" | "citation_received";
export type Achievement = { id: string; name: string; description: string; iconKey: string; badgeKey?: string; rarity: string; category?: string; ruleType?: AchievementRuleType; ruleConfig?: Record<string, unknown>; progressCurrent?: number; progressTarget?: number; xpReward?: number; titleRewardId?: string | null; hidden?: boolean; unlocked: boolean; unlockedAt?: string | null };
export type Title = { id: string; name: string; slug?: string; source?: TitleSource; unlockLevel: number | null; requiredLevel?: number | null; milestoneId?: string | null; achievementId?: string | null; unlocked?: boolean; unlockedAt?: string | null };
export type Milestone = { id: string; slug?: string; title: string; description: string; iconKey: string; weight: number; xpReward: number; isAutomatic?: boolean; isCoreJourney?: boolean; completed: boolean };
export type Friend = { id: string; username: string; title: string; phdYear: number; avatar: AvatarConfig; level?: number; totalXp?: number; sanity?: number; achievementNames: string[]; milestoneNames: string[]; friendsSince: string; acceptedAt?: string; friendshipStatus?: "add" | "friends" | "requested" | "incoming" };
export type FriendRequest = { id: string; from: Friend; createdAt: string };
export type SocialEventType = "achievement" | "milestone" | "task" | "level_up" | "achievement_unlocked" | "milestone_completed" | "paper_submitted" | "paper_accepted" | "conference_completed" | "major_research_event" | "thesis_submitted" | "defense_completed";
export type SocialReaction = "citation" | "kudos" | "👏" | "🫡" | "💀" | "🔬" | "☕";
export type SocialCitationUser = { id: string; username: string; avatar: AvatarConfig };
export type SocialEvent = { id: string; userId: string; username: string; avatar: AvatarConfig; type: SocialEventType; createdAt: string; sharedAt?: string; sourceId?: string; metadata: Record<string, string | number>; reactions: Partial<Record<SocialReaction, number>>; citationCount?: number; userHasCitation?: boolean; citationUsers?: SocialCitationUser[]; kudosCount?: number; userHasKudos?: boolean };
export type MonthlyStats = { month: string; tasks: number; xp: number; sanityChanges: number; topCategory: string };
export type TaskLog = { id: string; taskId: string; taskName: string; categoryId: string; categoryName: string; xpAwarded: number; occurredAt: string };

export type AppData = { profile: Profile; player: PlayerState; categories: TaskCategory[]; tasks: Task[]; achievements: Achievement[]; titles: Title[]; milestones: Milestone[]; friends: Friend[]; friendRequests: FriendRequest[]; friendDirectory: Friend[]; socialEvents: SocialEvent[]; socialReactions: Record<string, SocialReaction | null>; taskLogs: TaskLog[]; monthlyStats: MonthlyStats };
