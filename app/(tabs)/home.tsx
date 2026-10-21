import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { SanityMeter } from "@/src/components/game/SanityMeter";
import { XPProgressBar } from "@/src/components/game/XPProgressBar";
import { Card } from "@/src/components/ui/Card";
import { LoadingSkeleton } from "@/src/components/ui/LoadingSkeleton";
import { FocusFade } from "@/src/components/ui/Motion";
import { Screen } from "@/src/components/ui/Screen";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { DAILY_QUOTE_UNAVAILABLE, getCurrentAppDate, type DailyQuote } from "@/src/domain/dailyQuote";
import { getPhdProgress, getXpProgress } from "@/src/domain/game";
import { getDailyQuote } from "@/src/services/dailyQuoteService";
import { updateSanityRemote } from "@/src/services/gameService";
import { useAppStore } from "@/src/store/useAppStore";

export default function Home() {
  const { profile, player, milestones, applyPlayer } = useAppStore();
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [sanityDraft, setSanityDraft] = useState<number | null>(null);
  const [sanitySaving, setSanitySaving] = useState(false);
  const progress = getXpProgress(player.totalXp);
  const phdProgress = getPhdProgress(milestones);
  const displayedSanity = sanityDraft ?? player.sanity;

  useEffect(() => {
    let mounted = true;
    let appDate = getCurrentAppDate();
    async function loadDailyQuote() {
      if (mounted) setQuoteLoading(true);
      const nextQuote = await getDailyQuote();
      if (mounted) { setDailyQuote(nextQuote); setQuoteLoading(false); }
    }
    void loadDailyQuote();
    const timer = setInterval(() => { const nextDate = getCurrentAppDate(); if (nextDate !== appDate) { appDate = nextDate; void loadDailyQuote(); } }, 60_000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

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
      // The shared meter remains usable after a failed save; no success toast is shown.
    } finally {
      setSanityDraft(null);
      setSanitySaving(false);
    }
  }

  return <Screen scroll={false} style={styles.homeContent}>
    <FocusFade><View style={styles.header}><View style={styles.identity}><Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>Another day in academia, {profile.username}.</Text><Text style={styles.title} numberOfLines={1}>{profile.selectedTitle}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open profile" accessibilityHint="Opens your profile and character editor" onPress={() => router.push("/profile")} style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}><AvatarRenderer config={profile.avatar} size={56} /></Pressable></View></FocusFade>

    <FocusFade delay={35}><View style={styles.statusArea}><View style={styles.xpHeader}><Text style={styles.level}>Lv. {progress.level}</Text><Text style={styles.levelXp}>{progress.intoLevel} / {progress.required} XP</Text></View><XPProgressBar current={progress.intoLevel} next={progress.required} percentage={progress.percentage} hideMeta /><View style={styles.sanity}><SanityMeter sanity={displayedSanity} editable disabled={sanitySaving} onChange={setSanityDraft} onCommit={(nextSanity) => void saveSanity(nextSanity)} /></View></View></FocusFade>

    <FocusFade delay={70}><Card tone="navy" style={styles.wisdomCard}><Text style={styles.wisdomEyebrow}>TODAY&apos;S ACADEMIC WISDOM</Text>{quoteLoading ? <View style={styles.quoteSkeleton}><LoadingSkeleton lines={2} /></View> : <Text style={styles.wisdomText} numberOfLines={4}>{dailyQuote?.quote.text ?? DAILY_QUOTE_UNAVAILABLE}</Text>}</Card></FocusFade>

    <View style={styles.destinationStack}>
      <FocusFade delay={105} style={styles.destinationMotion}><Pressable accessibilityRole="button" accessibilityLabel="Open Tasks" accessibilityHint="Opens the Tasks page" onPress={() => router.push("/tasks")} style={({ pressed }) => [styles.destinationCard, styles.tasksCard, pressed && styles.pressed]}><View style={styles.destinationCopy}><Text style={styles.destinationEyebrow}>TASKS</Text><Text style={styles.destinationTitle} numberOfLines={1} adjustsFontSizeToFit>What did you survive today?</Text><Text style={styles.destinationMeta}>Browse the academic work you can log for XP.</Text></View><Text style={styles.destinationLink}>⟶</Text></Pressable></FocusFade>

      <FocusFade delay={140} style={styles.destinationMotion}><Pressable accessibilityRole="button" accessibilityLabel={`PhD Journey, ${phdProgress}% complete`} accessibilityHint="Opens the PhD journey" onPress={() => router.push("/phd")} style={({ pressed }) => [styles.destinationCard, styles.journeyCard, pressed && styles.pressed]}><View style={styles.destinationCopy}><Text style={styles.destinationEyebrow}>PhD JOURNEY</Text><Text style={styles.destinationTitle}>The long game</Text><Text style={styles.destinationMeta}>{milestones.filter((item) => item.completed).length} of {milestones.length} milestones completed</Text></View><View style={styles.destinationStat}><Text style={styles.destinationLink}>⟶</Text></View></Pressable></FocusFade>

      <FocusFade delay={175} style={styles.destinationMotion}><Pressable accessibilityRole="button" accessibilityLabel="Open Social" accessibilityHint="Opens the Social page" onPress={() => router.push("/social")} style={({ pressed }) => [styles.destinationCard, styles.socialCard, pressed && styles.pressed]}><View style={styles.destinationCopy}><Text style={styles.destinationEyebrow}>SOCIAL</Text><Text style={[styles.destinationTitle, styles.socialText]}>Find your people</Text><Text style={[styles.destinationMeta, styles.socialMeta]}>Small wins feel better when someone else gets it.</Text></View><View style={styles.destinationStat}><Text style={[styles.destinationLink, styles.socialLink]}>⟶</Text></View></Pressable></FocusFade>
    </View>

  </Screen>;
}

const styles = StyleSheet.create({
  homeContent: { flex: 1, paddingTop: spacing.md, paddingBottom: 0 }, header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingTop: spacing.xs, marginBottom: spacing.md }, identity: { flex: 1, minWidth: 0 }, greeting: { color: colors.primary, fontFamily: typography.display, fontSize: 21, lineHeight: 26 }, title: { color: colors.secondary, fontSize: 14, fontWeight: "800", marginTop: spacing.xs }, avatarButton: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD", alignItems: "center", justifyContent: "flex-end", overflow: "hidden", flexShrink: 0 }, statusArea: { marginBottom: spacing.md }, xpHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: spacing.sm }, level: { color: colors.primary, fontFamily: typography.display, fontSize: 20 }, levelXp: { color: colors.textSecondary, fontSize: 12, fontWeight: "800" }, sanity: { marginTop: spacing.md }, wisdomCard: { minHeight: 96, justifyContent: "center", marginBottom: spacing.md, borderColor: colors.primary }, wisdomEyebrow: { color: colors.warning, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.1 }, wisdomText: { color: colors.surface, fontFamily: typography.display, fontSize: 17, lineHeight: 23, marginTop: spacing.sm }, quoteSkeleton: { marginTop: spacing.sm }, destinationStack: { flex: 1, minHeight: 0, justifyContent: "space-between", gap: spacing.sm }, destinationMotion: { flex: 1 }, destinationCard: { flex: 1, minHeight: 0, borderRadius: radii.card, borderWidth: 2, padding: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }, journeyCard: { backgroundColor: colors.surface, borderColor: colors.primary }, tasksCard: { backgroundColor: colors.surface, borderColor: colors.primary }, socialCard: { backgroundColor: colors.surface, borderColor: colors.primary }, destinationCopy: { flex: 1, minWidth: 0 }, destinationEyebrow: { color: colors.secondary, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.1 }, destinationTitle: { color: colors.primary, fontFamily: typography.display, fontSize: 17, lineHeight: 20, marginTop: spacing.xs }, socialText: { color: colors.primary }, destinationMeta: { color: colors.textSecondary, fontSize: typography.metadata, lineHeight: 16, marginTop: spacing.xs }, socialMeta: { color: colors.textSecondary }, destinationStat: { alignItems: "flex-end" }, destinationLink: { color: colors.secondary, fontSize: 24, lineHeight: 28, fontWeight: "900", marginTop: spacing.xs }, socialLink: { color: colors.secondary }, pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] }
});
