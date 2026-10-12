import { Pressable, StyleSheet, Text, View } from "react-native";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { getSanityState, getXpProgress } from "@/src/domain/game";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import type { AvatarConfig, PlayerState } from "@/src/types/models";

export function PlayerStatusSummary({ player, avatar, onPress }: { player: PlayerState; avatar: AvatarConfig; onPress: () => void }) {
  const progress = getXpProgress(player.totalXp);
  const sanityState = getSanityState(player.sanity);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open profile. Level ${progress.level}, ${progress.intoLevel} of ${progress.required} XP, sanity ${player.sanity} percent`} onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
    <View style={styles.copy}>
      <Text style={styles.levelLabel}>LEVEL {progress.level}</Text>
      <View style={styles.xpRow}><Text style={styles.xpCurrent}>{progress.intoLevel} XP</Text><Text style={styles.xpGoal}>GOAL {progress.required}</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress.percentage * 100}%` }]} /></View>
      <Text style={styles.sanity}>{player.sanity}% SANITY <Text style={styles.mood}>· {sanityState.label}</Text></Text>
    </View>
    <View style={styles.avatarCircle}><AvatarRenderer config={avatar} size={58} /></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.hero, paddingVertical: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.xs, maxWidth: 190, minWidth: 0, flexShrink: 1 },
  copy: { flex: 1, minWidth: 0, paddingRight: 8 },
  levelLabel: { color: colors.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  xpRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 2 },
  xpCurrent: { color: colors.primary, fontFamily: typography.display, fontSize: 15 },
  xpGoal: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  track: { height: 6, borderRadius: 6, backgroundColor: colors.cream, overflow: "hidden", marginTop: spacing.xs },
  fill: { height: "100%", borderRadius: 6, backgroundColor: colors.coral },
  sanity: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.45, marginTop: 5 },
  mood: { color: colors.teal },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.mint, borderWidth: 2, borderColor: colors.warning, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
