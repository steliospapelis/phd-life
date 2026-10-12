import { Pressable, StyleSheet, Text, View } from "react-native";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { colors, spacing } from "@/src/config/theme";
import type { Friend } from "@/src/types/models";

export function FriendAvatar({ friend, onPress, size = 54 }: { friend: Friend; onPress: () => void; size?: number }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${friend.username}'s profile`} onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}><AvatarRenderer config={friend.avatar} size={size - 4} /></View>
    <Text style={styles.name} numberOfLines={1}>{friend.username}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({ container: { width: 68, alignItems: "center", minHeight: 76 }, avatar: { backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD", overflow: "hidden", alignItems: "center", justifyContent: "flex-end" }, name: { color: colors.textSecondary, fontSize: 11, fontWeight: "800", marginTop: spacing.xs, maxWidth: 68 }, pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] } });
