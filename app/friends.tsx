import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Screen } from "@/src/components/ui/Screen";
import { FriendAvatar } from "@/src/components/social/FriendAvatar";
import { colors, spacing, typography } from "@/src/config/theme";
import { useAppStore } from "@/src/store/useAppStore";

export default function Friends() {
  const friends = useAppStore((state) => state.friends).slice().sort((a, b) => a.username.localeCompare(b.username));
  return <Screen><AppHeader title="Labmates" subtitle="A small, non-competitive academic alliance." action={<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>} />
    {friends.length === 0 ? <Text style={styles.empty}>No labmates yet.</Text> : <View style={styles.list}>{friends.map((friend) => <Pressable key={friend.id} accessibilityRole="button" accessibilityLabel={`Open ${friend.username}'s profile`} onPress={() => router.push({ pathname: "/friend-profile", params: { friendId: friend.id } })} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.avatar}><FriendAvatar friend={friend} onPress={() => undefined} size={46} /></View><View style={styles.copy}><Text style={styles.username}>{friend.username}</Text><Text style={styles.title} numberOfLines={1}>{friend.title}</Text><Text style={styles.level}>Lv. {friend.level ?? 1}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</View>}
  </Screen>;
}

const styles = StyleSheet.create({ back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, backText: { color: colors.primary, fontSize: 24 }, list: { borderTopWidth: 1, borderTopColor: colors.line }, row: { minHeight: 72, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: spacing.md }, avatar: { width: 52, height: 56, alignItems: "center", justifyContent: "center", overflow: "hidden" }, copy: { flex: 1, minWidth: 0 }, username: { color: colors.primary, fontSize: 15, fontWeight: "900" }, title: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: 3 }, level: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 2 }, arrow: { color: colors.secondary, fontSize: 28, marginRight: spacing.xs }, empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] } });
