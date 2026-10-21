import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/src/components/ui/AppHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { CharacterBuilderSheet } from "@/src/components/avatar/CharacterBuilderSheet";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { Screen } from "@/src/components/ui/Screen";
import { SectionTitle } from "@/src/components/ui/SectionTitle";
import { ActivityReportSheet } from "@/src/components/profile/ActivityReportSheet";
import { SanityMeter } from "@/src/components/game/SanityMeter";
import { XPProgressBar } from "@/src/components/game/XPProgressBar";
import { TitleSelectionSheet } from "@/src/components/game/TitleSelectionSheet";
import { PhdYearSelectionSheet } from "@/src/components/game/PhdYearSelectionSheet";
import { borders, colors, radii, spacing, typography } from "@/src/config/theme";
import { getXpProgress } from "@/src/domain/game";
import { buildActivityReport, type ReportPeriod } from "@/src/domain/reports";
import { isSupabaseConfigured } from "@/src/config/app";
import { loadRemoteTaskLogs, selectTitleRemoteById, setPhdYearRemote, updateAvatarRemote, updateSanityRemote } from "@/src/services/gameService";
import { loadRemotePlayerState, loadRemoteProgressionData, loadRemoteProfile } from "@/src/services/contentService";
import { saveStoredAvatar } from "@/src/services/avatarStorage";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/hooks/useAuth";
import { useAppStore } from "@/src/store/useAppStore";
import type { Title } from "@/src/types/models";
import { isTitleUnlocked, sortTitles, titleRequirement } from "@/src/domain/titleUtils";
import { FocusFade } from "@/src/components/ui/Motion";

export default function Profile() {
  const { profile, player, titles, taskLogs, hydrateTaskLogs, hydrateProgressionData, hydrateProfile, updateAvatar, selectTitle, applyPlayer } = useAppStore();
  const { signOut } = useAuth();
  const { openTitles } = useLocalSearchParams<{ openTitles?: string }>();
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("week");
  const [builderVisible, setBuilderVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [titleSheetVisible, setTitleSheetVisible] = useState(openTitles === "1");
  const [yearSheetVisible, setYearSheetVisible] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [titleBusy, setTitleBusy] = useState<string | null>(null);
  const [yearBusy, setYearBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sanityDraft, setSanityDraft] = useState<number | null>(null);
  const [sanitySaving, setSanitySaving] = useState(false);
  const report = useMemo(() => buildActivityReport(taskLogs, reportPeriod), [taskLogs, reportPeriod]);
  const progress = getXpProgress(player.totalXp);
  const displayedSanity = sanityDraft ?? player.sanity;
  const sortedTitles = useMemo(() => sortTitles(titles, profile.selectedTitle, player.level), [player.level, profile.selectedTitle, titles]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!titleSheetVisible || !isSupabaseConfigured) return undefined;
    let mounted = true;
    void loadRemoteProgressionData().then((progression) => {
      if (mounted && progression) hydrateProgressionData(progression.achievements, progression.titles);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [hydrateProgressionData, titleSheetVisible]);

  useFocusEffect(useCallback(() => {
    if (!isSupabaseConfigured) return undefined;
    let mounted = true;
    void Promise.all([
      loadRemoteProfile().catch(() => null),
      loadRemoteTaskLogs().catch(() => null),
      loadRemoteProgressionData().catch(() => null),
      loadRemotePlayerState().catch(() => null),
    ]).then(([freshProfile, logs, progression, freshPlayer]) => {
      if (!mounted) return;
      if (freshProfile) hydrateProfile(freshProfile);
      if (logs) hydrateTaskLogs(logs);
      if (progression) hydrateProgressionData(progression.achievements, progression.titles);
      if (freshPlayer) applyPlayer(freshPlayer);
    });
    return () => { mounted = false; };
  }, [applyPlayer, hydrateProfile, hydrateProgressionData, hydrateTaskLogs]));

  async function logout() {
    await signOut();
    router.replace("/auth");
  }

  async function saveAvatar(nextAvatar: typeof profile.avatar) {
    setAvatarSaving(true);
    try {
      await saveStoredAvatar(profile.id, nextAvatar);
      if (isSupabaseConfigured && supabase) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user && authData.user.id !== profile.id) await saveStoredAvatar(authData.user.id, nextAvatar);
      }
      if (isSupabaseConfigured) await updateAvatarRemote(nextAvatar);
      updateAvatar(nextAvatar);
    } catch (error) {
      throw error instanceof Error ? error : new Error("Couldn't save your character. Try again.");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function changePhdYear(nextYear: number) {
    if (yearBusy || nextYear === profile.phdYear) {
      if (nextYear === profile.phdYear) setYearSheetVisible(false);
      return;
    }
    setYearBusy(true);
    try {
      const savedYear = isSupabaseConfigured ? await setPhdYearRemote(nextYear) : nextYear;
      hydrateProfile({ ...useAppStore.getState().profile, phdYear: savedYear });
      setYearSheetVisible(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't update your PhD year.");
    } finally {
      setYearBusy(false);
    }
  }

  async function equipTitle(title: Title) {
    const unlocked = isTitleUnlocked(title, player.level);
    if (!unlocked) {
      setNotice("Locked · " + titleRequirement(title));
      return;
    }
    if (title.name === profile.selectedTitle || titleBusy) return;
    setTitleBusy(title.id);
    try {
      if (isSupabaseConfigured) await selectTitleRemoteById(title.id);
      selectTitle(title.name);
      setTitleSheetVisible(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't equip that title.");
    } finally {
      setTitleBusy(null);
    }
  }

  async function saveSanity(nextSanity: number) {
    if (sanitySaving) return;
    if (nextSanity === player.sanity) {
      setSanityDraft(null);
      return;
    }
    setSanitySaving(true);
    try {
      const savedSanity = await updateSanityRemote(nextSanity);
      applyPlayer({ ...useAppStore.getState().player, sanity: savedSanity });
    } catch {
      setNotice("Couldn't save Sanity. Try again.");
    } finally {
      setSanityDraft(null);
      setSanitySaving(false);
    }
  }

  return <Screen scroll={false} style={styles.profileScreen}>
    <FocusFade><AppHeader title="Profile" subtitle="Still here, somehow." /></FocusFade>
    {notice ? <View accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

    <FocusFade delay={45}><Card style={styles.profileCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Customize your character"
        onPress={() => setBuilderVisible(true)}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarPressed]}
      >
        <View style={[styles.avatarFrame, { backgroundColor: profile.avatar.backgroundColor ?? colors.mint }]}><AvatarRenderer config={profile.avatar} size={104} /></View>
        <View style={styles.editAffordance}><Text style={styles.editIcon}>✎</Text></View>
      </Pressable>
      <Text style={styles.username}>{profile.username}</Text>
      <Text style={styles.level}>Lv. {player.level}</Text>
      <View style={styles.selectedTitleRow}><Text style={styles.selectedTitle} numberOfLines={2}>{profile.selectedTitle}</Text><Pressable accessibilityRole="button" accessibilityLabel="Change title" onPress={() => { setNotice(null); setTitleSheetVisible(true); }} style={({ pressed }) => [styles.titleEdit, pressed && styles.avatarPressed]}><Text style={styles.titleEditText}>✎</Text></Pressable></View>
      <View style={styles.phdMetaRow}><Text style={styles.phdMeta}>PhD year {profile.phdYear === 8 ? "8+" : profile.phdYear}</Text><Pressable accessibilityRole="button" accessibilityLabel="Edit PhD year" onPress={() => setYearSheetVisible(true)} style={({ pressed }) => [styles.yearEdit, pressed && styles.avatarPressed]}><Text style={styles.yearEditText}>✎</Text></Pressable></View>
      <View style={styles.progressBlock}>
        <XPProgressBar current={progress.intoLevel} next={progress.required} percentage={progress.percentage} />
        <View style={styles.sanityBlock}><SanityMeter sanity={displayedSanity} editable disabled={sanitySaving} onChange={setSanityDraft} onCommit={(nextSanity) => void saveSanity(nextSanity)} /></View>
      </View>
    </Card></FocusFade>

    <FocusFade delay={80}><SectionTitle title="Activity Report" /></FocusFade>
    <FocusFade delay={110}><Pressable accessibilityRole="button" accessibilityLabel="Open activity report" accessibilityHint="Opens the full activity report" onPress={() => setReportVisible(true)} style={({ pressed }) => [styles.reportPressable, pressed && styles.avatarPressed]}>
      <Card style={styles.reportPreviewCard}>
        <View style={styles.reportPreviewHeader}><Text style={styles.reportPreviewTitle}>Your academic damage, itemized.</Text></View>
        <Text style={styles.reportPreviewDescription}>Tap to review your week, month or year.</Text>
      </Card>
    </Pressable></FocusFade>

    <FocusFade delay={145}><Button label="Log out" variant="danger" onPress={() => void logout()} style={styles.logout} /></FocusFade>
    <CharacterBuilderSheet visible={builderVisible} value={profile.avatar} saving={avatarSaving} onClose={() => setBuilderVisible(false)} onSave={saveAvatar} />
    <ActivityReportSheet visible={reportVisible} report={report} reportPeriod={reportPeriod} onPeriodChange={setReportPeriod} onClose={() => setReportVisible(false)} />
    <TitleSelectionSheet visible={titleSheetVisible} titles={sortedTitles} level={player.level} selectedTitle={profile.selectedTitle} busyId={titleBusy} notice={notice} onSelect={equipTitle} onClose={() => { setTitleSheetVisible(false); if (openTitles === "1") router.setParams({ openTitles: undefined }); }} />
    <PhdYearSelectionSheet visible={yearSheetVisible} value={profile.phdYear} busy={yearBusy} onSelect={(year) => void changePhdYear(year)} onClose={() => setYearSheetVisible(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  profileScreen: { flex: 1, paddingBottom: 0 },
  notice: { backgroundColor: colors.mint, borderRadius: radii.control, padding: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
  noticeText: { color: colors.secondary, fontSize: typography.metadata, lineHeight: 18, fontWeight: "800", textAlign: "center" },
  profileCard: { alignItems: "center", padding: spacing.sm, marginBottom: spacing.sm, backgroundColor: colors.surface, borderColor: colors.border },
  avatarButton: { minWidth: 106, minHeight: 106, alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 2 },
  avatarPressed: { transform: [{ scale: 0.97 }] },
  avatarFrame: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.mint, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  editAffordance: { position: "absolute", right: 0, bottom: 1, width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.surface, alignItems: "center", justifyContent: "center" },
  editIcon: { color: colors.white, fontSize: 16, fontWeight: "900" },
  username: { color: colors.primary, fontFamily: typography.display, fontSize: 20, textAlign: "center" },
  level: { color: colors.secondary, fontSize: 14, fontWeight: "900", marginTop: 1 },
  selectedTitle: { color: colors.secondary, fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 3 },
  selectedTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, maxWidth: "100%" },
  titleEdit: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", marginTop: 3 },
  titleEditText: { color: colors.secondary, fontSize: 14, fontWeight: "900" },
  phdMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginTop: 2 },
  phdMeta: { color: colors.muted, fontSize: typography.metadata },
  yearEdit: { width: 24, height: 24, borderRadius: radii.pill, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  yearEditText: { color: colors.secondary, fontSize: 12, fontWeight: "900" },
  progressBlock: { alignSelf: "stretch", marginTop: 4, borderTopWidth: borders.separator, borderTopColor: colors.line, paddingTop: 4 },
  sanityBlock: { marginTop: 4 },
  reportPressable: { marginBottom: spacing.sm },
  reportPreviewCard: { borderColor: colors.border },
  reportPreviewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  reportPreviewTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 17 },
  reportPreviewDescription: { color: colors.muted, fontSize: typography.metadata, marginTop: 3 },
  logout: { marginTop: 0, marginBottom: spacing.xs },
});
