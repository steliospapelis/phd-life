import { Pressable, StyleSheet, Text, View } from "react-native";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { colors, spacing } from "@/src/config/theme";
import { clampSanity, getSanityState } from "@/src/domain/game";
import type { Friend } from "@/src/types/models";

export function LabmateCard({ friend, onPress }: { friend: Friend; onPress: () => void }) {
  const sanity = clampSanity(friend.sanity ?? 70);
  const state = getSanityState(sanity);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${friend.username}'s profile. Level ${friend.level ?? 1}. Sanity: ${state.label}.`} onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
    <View style={styles.avatar}><AvatarRenderer config={friend.avatar} size={64} /></View>
    <Text style={styles.username} numberOfLines={1}>{friend.username}</Text>
    <Text style={styles.level}>Lv. {friend.level ?? 1}</Text>
    <View style={styles.sanityTrack}><View style={[styles.sanityFill, { width: `${sanity}%` }]} /></View>
    <Text style={styles.sanityLabel} numberOfLines={2}>{state.label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  container: { width: 104, alignItems: "center", minHeight: 148, paddingVertical: spacing.xs },
  avatar: { width: 68, height: 68, borderRadius: 34, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD" },
  username: { color: colors.primary, fontSize: 12, lineHeight: 15, fontWeight: "900", marginTop: spacing.xs, maxWidth: 100, minHeight: 15 },
  level: { color: colors.textSecondary, fontSize: 10, fontWeight: "800", marginTop: 2 },
  sanityTrack: { width: 78, height: 6, borderRadius: 99, backgroundColor: colors.cream, overflow: "hidden", marginTop: spacing.sm },
  sanityFill: { height: "100%", borderRadius: 99, backgroundColor: colors.teal },
  sanityLabel: { color: colors.secondary, fontSize: 10, lineHeight: 12, fontWeight: "900", textAlign: "center", marginTop: 3, maxWidth: 100, minHeight: 24 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
