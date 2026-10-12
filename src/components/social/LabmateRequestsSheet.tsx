import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { Button } from "@/src/components/ui/Button";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { useAppStore } from "@/src/store/useAppStore";
import { respondToFriendRequestRemote } from "@/src/services/socialService";

export function LabmateRequestsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const requests = useAppStore((state) => state.friendRequests);
  const accept = useAppStore((state) => state.acceptFriendRequest);
  const decline = useAppStore((state) => state.declineFriendRequest);
  const [busy, setBusy] = useState<string | null>(null);

  async function acceptRequest(id: string) {
    setBusy(id);
    try { await respondToFriendRequestRemote(id, true); } catch { /* Keep the local demo usable before the migration is applied. */ }
    accept(id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setBusy(null);
  }

  async function declineRequest(id: string) {
    setBusy(id);
    try { await respondToFriendRequestRemote(id, false); } catch { /* Keep the local demo usable before the migration is applied. */ }
    decline(id);
    setBusy(null);
  }

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <SafeAreaView style={styles.sheet} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}><Pressable accessibilityRole="button" accessibilityLabel="Close labmate requests" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.sheetTitle}>Labmate requests</Text>
          <Text style={styles.subtitle}>Academic alliances, pending.</Text>
          {requests.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No pending requests.</Text><Text style={styles.emptyCopy}>The lab is currently at administrative peace.</Text></View> : <View style={styles.list}>
            {requests.map((request) => <View style={styles.row} key={request.id}><View style={styles.avatar}><AvatarRenderer config={request.from.avatar} size={48} /></View><View style={styles.copy}><Text style={styles.username}>{request.from.username}</Text><Text style={styles.title} numberOfLines={1}>{request.from.title}</Text><Text style={styles.level}>Lv. {request.from.level ?? 1}</Text><View style={styles.actions}><Button label="Accept" disabled={busy === request.id} accessibilityLabel={`Accept labmate request from ${request.from.username}`} onPress={() => void acceptRequest(request.id)} style={styles.accept} /><Button label="Decline" variant="secondary" disabled={busy === request.id} accessibilityLabel={`Decline labmate request from ${request.from.username}`} onPress={() => void declineRequest(request.id)} style={styles.decline} /></View></View></View>)}
          </View>}
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(23, 52, 92, 0.42)", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", backgroundColor: colors.background, borderTopLeftRadius: radii.hero, borderTopRightRadius: radii.hero, overflow: "hidden" },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHeader: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md },
  close: { width: 35, height: 35, borderRadius: radii.control, backgroundColor: colors.cream, justifyContent: "center", alignItems: "center" },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 27, fontWeight: "300" },
  sheetTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 28 },
  subtitle: { color: colors.muted, lineHeight: 20, marginTop: 11, marginBottom: spacing.md },
  list: { gap: spacing.md },
  row: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radii.card, padding: spacing.md, flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  avatar: { width: 54, height: 58, borderRadius: 29, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD" },
  copy: { flex: 1, minWidth: 0 },
  username: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  title: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: 3 },
  level: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 2 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  accept: { minHeight: 52, borderRadius: radii.control, paddingHorizontal: spacing.md },
  decline: { minHeight: 52, borderRadius: radii.control, paddingHorizontal: spacing.md },
  empty: { alignItems: "center", paddingVertical: spacing.xl },
  emptyTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 22, textAlign: "center" },
  emptyCopy: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: spacing.xs },
});
