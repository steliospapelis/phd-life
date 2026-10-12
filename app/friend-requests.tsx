import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Screen } from "@/src/components/ui/Screen";
import { Button } from "@/src/components/ui/Button";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { colors, spacing, typography } from "@/src/config/theme";
import { useAppStore } from "@/src/store/useAppStore";
import { respondToFriendRequestRemote } from "@/src/services/socialService";

export default function FriendRequests() {
  const requests = useAppStore((state) => state.friendRequests);
  const accept = useAppStore((state) => state.acceptFriendRequest);
  const decline = useAppStore((state) => state.declineFriendRequest);
  const [busy, setBusy] = useState<string | null>(null);
  async function acceptRequest(id: string) { setBusy(id); try { await respondToFriendRequestRemote(id, true); } catch { /* The local demo remains usable before the migration is applied. */ } accept(id); await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); setBusy(null); }
  async function declineRequest(id: string) { setBusy(id); try { await respondToFriendRequestRemote(id, false); } catch { /* The local demo remains usable before the migration is applied. */ } decline(id); setBusy(null); }
  return <Screen><AppHeader title="Labmate requests" subtitle="Academic alliances, pending." action={<Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>} />
    {requests.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No pending requests.</Text><Text style={styles.emptyCopy}>The lab is currently at administrative peace.</Text></View> : <View>{requests.map((request) => <View style={styles.row} key={request.id}><View style={styles.avatar}><AvatarRenderer config={request.from.avatar} size={48} /></View><View style={styles.copy}><Text style={styles.username}>{request.from.username}</Text><Text style={styles.title} numberOfLines={1}>{request.from.title}</Text><Text style={styles.level}>Lv. {request.from.level ?? 1}</Text><View style={styles.actions}><Button label="Accept" disabled={busy === request.id} accessibilityLabel={`Accept labmate request from ${request.from.username}`} onPress={() => void acceptRequest(request.id)} style={styles.accept} /><Button label="Decline" variant="ghost" disabled={busy === request.id} accessibilityLabel={`Decline labmate request from ${request.from.username}`} onPress={() => declineRequest(request.id)} style={styles.decline} /></View></View></View>)}</View>}
  </Screen>;
}

const styles = StyleSheet.create({ back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, backText: { color: colors.primary, fontSize: 24 }, row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line }, avatar: { width: 54, height: 58, borderRadius: 29, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD" }, copy: { flex: 1, minWidth: 0 }, username: { color: colors.primary, fontSize: 15, fontWeight: "900" }, title: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: 3 }, level: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 2 }, actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }, accept: { minHeight: 42, paddingHorizontal: spacing.md }, decline: { minHeight: 42, paddingHorizontal: spacing.sm }, empty: { alignItems: "center", paddingVertical: spacing.xl }, emptyTitle: { color: colors.primary, fontSize: typography.cardTitle, fontWeight: "900" }, emptyCopy: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: spacing.xs }, pressed: { opacity: 0.78 }, });
