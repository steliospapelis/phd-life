import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AvatarConfig } from "@/src/types/models";

const storageKey = (userId: string) => `phd-life.avatar.${userId}`;

export async function loadStoredAvatar(userId: string): Promise<AvatarConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as AvatarConfig;
  } catch {
    return null;
  }
}

export async function saveStoredAvatar(userId: string, avatar: AvatarConfig): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(avatar));
}
