import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Button } from "@/src/components/ui/Button";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { isSupabaseConfigured } from "@/src/config/app";
import { useAppStore } from "@/src/store/useAppStore";
import { searchRemoteUsers, sendFriendRequestRemote } from "@/src/services/socialService";

export function AddFriendSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile, friends, friendRequests, friendDirectory } = useAppStore();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [requested, setRequested] = useState<string[]>([]);
  const [remoteResults, setRemoteResults] = useState<typeof friendDirectory>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!visible || !isSupabaseConfigured || debouncedQuery.length < 2) return;
    let mounted = true;
    void searchRemoteUsers(debouncedQuery).then((items) => {
      if (mounted) setRemoteResults(items);
    }).catch(() => {
      if (mounted) {
        setRemoteResults(friendDirectory.filter((friend) => friend.username.toLowerCase().includes(debouncedQuery)).filter((friend) => friend.id !== profile.id));
        setNotice("Showing local labmates while the server is unavailable.");
      }
    });
    return () => { mounted = false; };
  }, [debouncedQuery, friendDirectory, profile.id, visible]);

  const localResults = useMemo(() => debouncedQuery.length < 2 ? [] : friendDirectory.filter((friend) => friend.username.toLowerCase().includes(debouncedQuery)).filter((friend) => friend.id !== profile.id), [debouncedQuery, friendDirectory, profile.id]);
  const results = isSupabaseConfigured ? remoteResults : localResults;

  async function sendRequest(id: string) {
    try {
      await sendFriendRequestRemote(id);
      setRequested((current) => current.includes(id) ? current : [...current, id]);
      setNotice("Request sent. Academic alliance pending.");
    } catch {
      setRequested((current) => current.includes(id) ? current : [...current, id]);
      setNotice("Request saved for this demo session. Academic alliance pending.");
    }
  }

  function closeSheet() {
    setQuery("");
    setDebouncedQuery("");
    setRequested([]);
    setRemoteResults([]);
    setNotice(null);
    onClose();
  }

  return <BottomSheet visible={visible} title="Find labmates" onClose={closeSheet} size="large">
    <Text style={styles.subtitle}>Find someone by username.</Text>
    <Text style={styles.label}>USERNAME SEARCH</Text>
    <TextInput accessibilityLabel="Search username" value={query} onChangeText={setQuery} placeholder="Search username…" placeholderTextColor={colors.textSecondary} autoCapitalize="none" autoCorrect={false} style={styles.input} />
    {notice ? <View accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}
    <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {debouncedQuery.length > 0 && debouncedQuery.length < 2 ? <Text style={styles.helper}>Enter at least 2 characters.</Text> : null}
      {debouncedQuery.length >= 2 && results.length === 0 ? <Text style={styles.empty}>No users found with that username.</Text> : null}
      <View>{results.map((friend) => {
        const isFriend = friend.friendshipStatus === "friends" || friends.some((item) => item.id === friend.id);
        const isPending = isFriend ? false : friend.friendshipStatus === "requested" || friendRequests.some((request) => request.from.id === friend.id) || requested.includes(friend.id);
        return <View style={styles.result} key={friend.id}>
          <View style={styles.avatar}><AvatarRenderer config={friend.avatar} size={48} /></View>
          <View style={styles.copy}><Text style={styles.username}>{friend.username}</Text><Text style={styles.title} numberOfLines={1}>{friend.title}</Text><Text style={styles.level}>Lv. {friend.level ?? 1}</Text></View>
          <Button label={isFriend ? "Labmates" : isPending ? "Requested" : "Add labmate"} disabled={isFriend || isPending} variant={isFriend || isPending ? "secondary" : "primary"} accessibilityLabel={isFriend ? `${friend.username} is already your labmate` : isPending ? `Labmate request sent to ${friend.username}` : `Send labmate request to ${friend.username}`} onPress={() => void sendRequest(friend.id)} style={styles.action} />
        </View>;
      })}</View>
    </ScrollView>
  </BottomSheet>;
}

const styles = StyleSheet.create({
  subtitle: { color: colors.muted, lineHeight: 20, marginTop: -spacing.sm, marginBottom: spacing.md },
  label: { color: colors.coral, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.2, marginBottom: spacing.sm },
  input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radii.control, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.primary, fontSize: typography.bodySize },
  resultsScroll: { maxHeight: 390, marginTop: spacing.sm },
  resultsContent: { paddingBottom: spacing.md },
  helper: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: spacing.md },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
  result: { minHeight: 80, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 54, height: 58, borderRadius: 29, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD" },
  copy: { flex: 1, minWidth: 0 },
  username: { color: colors.primary, fontSize: 14, fontWeight: "900" },
  title: { color: colors.textSecondary, fontSize: typography.metadata, marginTop: 3 },
  level: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 2 },
  action: { minHeight: 42, paddingHorizontal: spacing.md },
  notice: { backgroundColor: colors.mint, borderRadius: radii.control, padding: spacing.sm, marginTop: spacing.md },
  noticeText: { color: colors.secondary, fontSize: typography.metadata, fontWeight: "800", textAlign: "center" },
});
