import { isSupabaseConfigured } from "@/src/config/app";
import { completeTaskRemote } from "@/src/services/gameService";
import type { Task, TaskCompletionResult, PlayerState } from "@/src/types/models";

type CompletionOptions = {
  task: Task;
  sessionExists: boolean;
  currentPlayer: PlayerState;
  completeLocalTask: (taskId: string) => TaskCompletionResult;
  recordTaskLog: (task: Task, xpAwarded: number) => void;
  applyPlayer: (player: PlayerState) => void;
  operationKey?: string;
};

export async function completeTaskFlow({ task, sessionExists, currentPlayer, completeLocalTask, recordTaskLog, applyPlayer, operationKey }: CompletionOptions): Promise<TaskCompletionResult> {
  if (isSupabaseConfigured && !sessionExists) throw new Error("Your session is not active. Sign in again, then try logging this task.");
  const remoteResult = isSupabaseConfigured ? await completeTaskRemote(task.id, operationKey) as TaskCompletionResult : completeLocalTask(task.id);
  const result: TaskCompletionResult = { ...remoteResult, xpGained: remoteResult.xpGained ?? remoteResult.xpAwarded, previousLevel: remoteResult.previousLevel ?? currentPlayer.level, currentLevel: remoteResult.currentLevel ?? remoteResult.level, unlockedTitles: remoteResult.unlockedTitles ?? [], unlockedAchievements: remoteResult.unlockedAchievements ?? [], completedTask: remoteResult.completedTask ?? { id: task.id, name: task.name, categoryName: task.categoryName, xpReward: task.xpReward, isMajor: task.isMajor }, acknowledgement: remoteResult.acknowledgement ?? "NICELY SURVIVED" };
  applyPlayer({ totalXp: result.totalXp, sanity: result.sanity ?? currentPlayer.sanity, level: result.level });
  if (isSupabaseConfigured) recordTaskLog(task, result.xpAwarded);
  return result;
}
