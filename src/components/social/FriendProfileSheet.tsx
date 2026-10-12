import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { Button } from "@/src/components/ui/Button";
import { SanityMeter } from "@/src/components/game/SanityMeter";
import { XPProgressBar } from "@/src/components/game/XPProgressBar";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { getXpProgress } from "@/src/domain/game";
import { useAppStore } from "@/src/store/useAppStore";
import { removeFriendRemote } from "@/src/services/socialService";
import type { Friend } from "@/src/types/models";

export function FriendProfileSheet({ friend, visible, onClose }: { friend: Friend | null; visible: boolean; onClose: () => void }) {
  const removeFriend = useAppStore((state) => state.removeFriend);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!friend) return null;
  const progress = getXpProgress(friend.totalXp ?? 0);
  const acceptedDate = friend.acceptedAt ? new Date(friend.acceptedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : friend.friendsSince || "Not available";

  async function remove() {
    if (busy) return;
    setBusy(true);
    try { await removeFriendRemote(friend!.id); } catch { /* Keep the local demo usable when the migration is not live yet. */ }
    removeFriend(friend!.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setConfirming(false);
    setBusy(false);
    onClose();
  }

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}><Pressable accessibilityRole="button" accessibilityLabel={`Close ${friend.username}'s profile`} onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <View style={styles.avatar}><AvatarRenderer config={friend.avatar} size={104} /></View>
          <Text style={styles.sheetTitle}>{friend.username}</Text>
          <Text style={styles.subtitle}>Your labmate in academia.</Text>
          <Text style={styles.friendTitle}>{friend.title}</Text>
          <Text style={styles.level}>Lv. {friend.level ?? progress.level}</Text>
          <View style={styles.infoCard}>
            <XPProgressBar current={progress.intoLevel} next={progress.required} percentage={progress.percentage} />
            <View style={styles.sanity}><SanityMeter sanity={friend.sanity ?? 70} /></View>
          </View>
          <View style={styles.since}><Text style={styles.sinceLabel}>LABMATES SINCE</Text><Text style={styles.sinceDate}>{acceptedDate}</Text></View>
          {confirming ? <View style={styles.confirmCard}><Text style={styles.confirmTitle}>Remove {friend.username}?</Text><Text style={styles.confirmCopy}>You&apos;ll stop seeing each other&apos;s shared activity.</Text><View style={styles.confirmActions}><Button label="Cancel" variant="secondary" onPress={() => setConfirming(false)} style={styles.confirmButton} /><Button label="Remove" variant="danger" disabled={busy} onPress={() => void remove()} style={styles.confirmButton} /></View></View> : <Button label="Remove labmate" variant="danger" accessibilityLabel={`Remove ${friend.username} from your labmates`} onPress={() => setConfirming(true)} style={styles.removeButton} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(23, 52, 92, 0.42)", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: colors.background, borderTopLeftRadius: radii.hero, borderTopRightRadius: radii.hero, overflow: "hidden" },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xl, alignItems: "center" },
  sheetHeader: { width: "100%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  close: { width: 35, height: 35, borderRadius: radii.control, backgroundColor: colors.cream, justifyContent: "center", alignItems: "center" },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 27, fontWeight: "300" },
  avatar: { width: 126, height: 126, borderRadius: 63, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD", marginBottom: spacing.md },
  sheetTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 28, textAlign: "center" },
  subtitle: { color: colors.muted, lineHeight: 20, marginTop: 5, textAlign: "center" },
  friendTitle: { color: colors.secondary, fontSize: typography.bodySize, fontWeight: "900", marginTop: spacing.sm, textAlign: "center" },
  level: { color: colors.coral, fontSize: 14, fontWeight: "900", marginTop: 4 },
  infoCard: { width: "100%", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radii.card, padding: spacing.md, marginTop: spacing.lg },
  sanity: { marginTop: spacing.md },
  since: { alignItems: "center", marginTop: spacing.lg },
  sinceLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  sinceDate: { color: colors.primary, fontFamily: typography.display, fontSize: 18, marginTop: spacing.xs },
  removeButton: { width: "100%", minHeight: 44, marginTop: spacing.lg },
  confirmCard: { width: "100%", backgroundColor: colors.peach, borderRadius: radii.control, padding: spacing.md, marginTop: spacing.lg },
  confirmTitle: { color: colors.coral, fontSize: typography.cardTitle, fontWeight: "900" },
  confirmCopy: { color: colors.ink, fontSize: typography.metadata, lineHeight: 18, marginTop: spacing.xs },
  confirmActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  confirmButton: { flex: 1 },
});
