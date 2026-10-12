import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Screen } from "@/src/components/ui/Screen";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { SanityMeter } from "@/src/components/game/SanityMeter";
import { XPProgressBar } from "@/src/components/game/XPProgressBar";
import { colors, spacing, typography } from "@/src/config/theme";
import { getXpProgress } from "@/src/domain/game";
import { useAppStore } from "@/src/store/useAppStore";
import { removeFriendRemote } from "@/src/services/socialService";

export default function FriendProfile() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const { friends, removeFriend } = useAppStore();
  const friend = friends.find((item) => item.id === friendId);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!friend) return <Screen><AppHeader title="Labmate profile" subtitle="Your labmate in academia." action={<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>} /><Text style={styles.empty}>That labmate is no longer available.</Text></Screen>;
  const progress = getXpProgress(friend.totalXp ?? 0);
  const acceptedDate = friend.acceptedAt ? new Date(friend.acceptedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : friend.friendsSince || "Not available";
  async function remove() {
    if (busy) return;
    setBusy(true);
    try { await removeFriendRemote(friend!.id); } catch { /* Keep the local demo usable when the migration is not live yet. */ }
    removeFriend(friend!.id);
    setConfirming(false);
    setBusy(false);
    router.back();
  }
  return <Screen><AppHeader title={friend.username} subtitle="Your labmate in academia." action={<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>} />
    <Card tone="mint" style={styles.identity}><View style={styles.avatar}><AvatarRenderer config={friend.avatar} size={112} /></View><Text style={styles.username}>{friend.username}</Text><Text style={styles.title}>{friend.title}</Text><Text style={styles.level}>Lv. {friend.level ?? progress.level}</Text><View style={styles.progressBlock}><XPProgressBar current={progress.intoLevel} next={progress.required} percentage={progress.percentage} /><View style={styles.sanity}><SanityMeter sanity={friend.sanity ?? 70} /></View></View></Card>
    <View style={styles.since}><Text style={styles.sinceLabel}>LABMATES SINCE</Text><Text style={styles.sinceDate}>{acceptedDate}</Text></View>
    <Button label="Remove labmate" variant="quiet" accessibilityLabel={`Remove ${friend.username} from your labmates`} onPress={() => setConfirming(true)} style={styles.removeButton} />
    <BottomSheet visible={confirming} title={`Remove ${friend.username} from your labmates?`} onClose={() => setConfirming(false)}><Text style={styles.confirmCopy}>You&apos;ll stop seeing each other&apos;s shared activity.</Text><View style={styles.confirmActions}><Button label="Cancel" variant="secondary" onPress={() => setConfirming(false)} style={styles.confirmButton} /><Button label="Remove" variant="danger" disabled={busy} onPress={() => void remove()} style={styles.confirmButton} /></View></BottomSheet>
  </Screen>;
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.primary, fontSize: 24 },
  identity: { alignItems: "center", borderColor: "#C9DDCD", marginBottom: spacing.xl },
  avatar: { width: 126, height: 126, borderRadius: 63, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", backgroundColor: colors.surface, borderWidth: 1, borderColor: "#C9DDCD", marginBottom: spacing.md },
  username: { color: colors.primary, fontFamily: typography.display, fontSize: 25 },
  title: { color: colors.secondary, fontSize: typography.bodySize, fontWeight: "900", marginTop: 4 },
  level: { color: colors.coral, fontSize: 14, fontWeight: "900", marginTop: 5 },
  progressBlock: { alignSelf: "stretch", marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  sanity: { marginTop: spacing.md },
  since: { alignItems: "center", marginBottom: spacing.md },
  sinceLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  sinceDate: { color: colors.primary, fontFamily: typography.display, fontSize: 18, marginTop: spacing.xs },
  removeButton: { alignSelf: "center", minHeight: 44 },
  confirmCopy: { color: colors.textSecondary, fontSize: typography.bodySize, lineHeight: 21 },
  confirmActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  confirmButton: { flex: 1 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
});
