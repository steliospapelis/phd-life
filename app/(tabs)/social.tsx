import { useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/src/components/ui/Screen";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SectionTitle } from "@/src/components/ui/SectionTitle";
import { LoadingSkeleton } from "@/src/components/ui/LoadingSkeleton";
import { ScrollablePanel } from "@/src/components/ui/ScrollablePanel";
import { LabmateCard } from "@/src/components/social/LabmateCard";
import { LabmateRequestsSheet } from "@/src/components/social/LabmateRequestsSheet";
import { FriendProfileSheet } from "@/src/components/social/FriendProfileSheet";
import { AddFriendSheet } from "@/src/components/social/AddFriendSheet";
import { SocialEventRow } from "@/src/components/social/SocialEventRow";
import { colors, radii, sectionTheme, spacing, typography } from "@/src/config/theme";
import { useAppStore } from "@/src/store/useAppStore";
import { isSupabaseConfigured } from "@/src/config/app";
import { loadRemoteSocialBootstrap, toggleLabCitationRemote } from "@/src/services/socialService";
import { loadRemoteProgressionData } from "@/src/services/contentService";
import { FocusFade } from "@/src/components/ui/Motion";

export default function Social() {
  const { profile, friends, friendRequests, socialEvents, socialReactions, setSocialReaction, updateSocialEventCitations, hydrateSocialData, appendSocialEvents, applyPlayer, hydrateProgressionData } = useAppStore();
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(undefined);
  const visibleEvents = useMemo(() => socialEvents.filter((event) => (event.type === "achievement" || event.type === "milestone" || event.type === "task") && (event.userId === profile.id || friends.some((friend) => friend.id === event.userId))).sort((a, b) => new Date(b.sharedAt ?? b.createdAt).getTime() - new Date(a.sharedAt ?? a.createdAt).getTime()), [friends, profile.id, socialEvents]);
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? null;

  async function refresh() {
    setRefreshing(true);
    try {
      const data = await loadRemoteSocialBootstrap();
      if (data) { hydrateSocialData(data.friends, data.requests, data.events); setNextCursor(data.nextCursor); }
    } catch { setNotice("Couldn't refresh the lab right now."); }
    finally { setRefreshing(false); }
  }

  async function loadMore() {
    if (!isSupabaseConfigured || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await loadRemoteSocialBootstrap(nextCursor);
      if (data) { appendSocialEvents(data.events); setNextCursor(data.nextCursor); }
    } catch { setNotice("Couldn't load more activity right now."); }
    finally { setLoadingMore(false); }
  }

  async function toggleCitation(eventId: string) {
    const wasSelected = socialReactions[eventId] === "citation";
    const event = socialEvents.find((item) => item.id === eventId);
    const previousCount = event?.citationCount ?? event?.reactions?.citation ?? event?.kudosCount ?? event?.reactions?.kudos ?? 0;
    const localDemoEvent = eventId.startsWith("s");
    setSocialReaction(eventId, wasSelected ? null : "citation");
    updateSocialEventCitations(eventId, Math.max(0, previousCount + (wasSelected ? -1 : 1)), !wasSelected);
    try {
      const result = await toggleLabCitationRemote(eventId);
      if (result) {
        setSocialReaction(eventId, result.active ? "citation" : null);
        updateSocialEventCitations(eventId, result.count, result.active);
        if (typeof result.totalXp === "number" && typeof result.level === "number") applyPlayer({ ...useAppStore.getState().player, totalXp: result.totalXp, level: result.level });
        if ((result.achievementXpAwarded ?? 0) > 0) void loadRemoteProgressionData().then((data) => { if (data) hydrateProgressionData(data.achievements, data.titles); }).catch(() => undefined);
      }
    } catch {
      if (localDemoEvent) return;
      setSocialReaction(eventId, wasSelected ? "citation" : null);
      updateSocialEventCitations(eventId, previousCount, wasSelected);
      setNotice("Couldn't record this citation right now.");
    }
  }

  return <Screen scroll={false} style={styles.screen}>
    <FocusFade><AppHeader title="Social" subtitle="Your little corner of academia." action={<Image accessibilityLabel="PhD Life labmates" source={require("@/images/branding/phd-social.png")} resizeMode="contain" style={styles.headerArt} />} /></FocusFade>

    {friendRequests.length > 0 ? <FocusFade delay={35}><Pressable accessibilityRole="button" accessibilityLabel={`${friendRequests.length} labmate requests`} onPress={() => setRequestsOpen(true)} style={({ pressed }) => [styles.requestRow, pressed && styles.pressed]}><Text style={styles.requestText}>{friendRequests.length} labmate request{friendRequests.length === 1 ? "" : "s"}</Text><Text style={styles.requestArrow}>→</Text></Pressable></FocusFade> : null}

    <FocusFade delay={65}><SectionTitle title="Your Labmates" /></FocusFade>
    <FocusFade delay={95}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} style={styles.carouselScroll}>
      <Pressable accessibilityRole="button" accessibilityLabel="Add a labmate" onPress={() => setAddFriendOpen(true)} style={({ pressed }) => [styles.addPerson, pressed && styles.pressed]}><Text style={styles.addPersonIcon}>＋</Text><Text style={styles.addPersonLabel}>Add</Text></Pressable>
      {friends.map((friend) => <LabmateCard key={friend.id} friend={friend} onPress={() => setSelectedFriendId(friend.id)} />)}
    </ScrollView></FocusFade>

    <FocusFade delay={125} style={styles.feedMotion}><View style={styles.feedArea}>
      <View style={styles.feedHeader}><SectionTitle title="Recent Activity" /></View>
      <ScrollablePanel
        style={styles.feedPanel}
        contentContainerStyle={styles.feedContent}
        nestedScrollEnabled
        showScrollBar={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.secondary} />}
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 180) void loadMore();
        }}
      >
        {friends.length === 0 && visibleEvents.length === 0 ? <View style={styles.emptyPeople}><Text style={styles.emptyIllustration}>✦</Text><EmptyState title="Research is difficult enough." message="Bring reinforcements." icon={null} /></View> : visibleEvents.length === 0 ? <EmptyState title="Nothing shared yet." message="Give academia a little time." icon={<Text style={styles.emptyIcon}>☕</Text>} /> : <View>{visibleEvents.slice(0, 15).map((event, index) => { const selected = socialReactions[event.id] ?? null; const ownActivity = event.userId === profile.id; const friend = ownActivity ? undefined : friends.find((item) => item.id === event.userId); return <FocusFade key={event.id} delay={index * 25} style={styles.eventMotion}><SocialEventRow event={event} friend={friend} authorTitle={ownActivity ? profile.selectedTitle : friend?.title} viewer={{ id: profile.id, username: profile.username, avatar: profile.avatar }} selectedReaction={selected} allowCitation onReaction={() => void toggleCitation(event.id)} onOpenProfile={() => ownActivity ? router.push("/profile") : setSelectedFriendId(event.userId)} /></FocusFade>; })}</View>}
        {loadingMore ? <View style={styles.loadingMore}><LoadingSkeleton lines={2} /></View> : null}
        {notice ? <View accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}
      </ScrollablePanel>
    </View></FocusFade>
    <LabmateRequestsSheet visible={requestsOpen} onClose={() => setRequestsOpen(false)} />
    {addFriendOpen ? <AddFriendSheet visible onClose={() => setAddFriendOpen(false)} /> : null}
    <FriendProfileSheet friend={selectedFriend} visible={Boolean(selectedFriend)} onClose={() => setSelectedFriendId(null)} />
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: spacing.sm },
  headerArt: { width: 88, height: 64, marginRight: -spacing.sm, opacity: 0.92 },
  requestRow: { minHeight: 48, borderRadius: radii.control, backgroundColor: sectionTheme.social.surface, borderWidth: 1, borderColor: sectionTheme.social.border, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
  requestText: { color: colors.surface, fontSize: typography.bodySize, fontWeight: "600" },
  requestArrow: { color: colors.surface, fontSize: typography.bodySize, fontWeight: "600" },
  carouselScroll: { height: 160, flexGrow: 0, flexShrink: 0, marginHorizontal: -spacing.xs, marginBottom: 0 },
  carousel: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  addPerson: { width: 104, minHeight: 148, alignItems: "center", justifyContent: "flex-start", paddingVertical: spacing.xs },
  addPersonIcon: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: "#C9DDCD", backgroundColor: colors.mint, color: colors.secondary, fontSize: 27, lineHeight: 65, textAlign: "center" },
  addPersonLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "800", marginTop: spacing.xs },
  emptyPeople: { alignItems: "center", paddingTop: spacing.xl, paddingBottom: spacing.md, marginBottom: spacing.lg },
  emptyIllustration: { color: colors.coral, fontSize: 26, marginBottom: -spacing.sm },
  feedMotion: { flex: 1, minHeight: 0 }, feedArea: { flex: 1, minHeight: 0 }, eventMotion: { width: "100%" },
  feedHeader: { marginTop: 0, marginBottom: spacing.sm },
  feedPanel: { flex: 1, minHeight: 0, borderWidth: 0, borderColor: "transparent", borderRadius: radii.card, backgroundColor: colors.background, paddingHorizontal: spacing.sm },
  feedContent: { paddingBottom: spacing.md },
  emptyIcon: { color: colors.coral, fontSize: 22 },
  loadingMore: { paddingVertical: spacing.lg },
  notice: { backgroundColor: colors.peach, borderRadius: radii.control, padding: spacing.sm, marginTop: spacing.md },
  noticeText: { color: colors.primary, fontSize: typography.metadata, fontWeight: "800", textAlign: "center" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
