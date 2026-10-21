import { useEffect } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabIcon } from "@/src/components/ui/TabIcon";
import { colors, componentHeight, radii, spacing } from "@/src/config/theme";
import { useAppStore } from "@/src/store/useAppStore";
import { isSupabaseConfigured } from "@/src/config/app";
import { getXpProgress } from "@/src/domain/game";
import { claimDailySurvivalRemote } from "@/src/services/gameService";
import { loadRemoteHomeData, loadRemoteMilestones, loadRemoteProgressionData, loadRemoteProfile } from "@/src/services/contentService";
import { loadRemoteSocialBootstrap } from "@/src/services/socialService";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase/client";
import { loadStoredAvatar } from "@/src/services/avatarStorage";

const tabItems = [
  { name: "home", label: "Home" },
  { name: "tasks", label: "Tasks" },
  { name: "phd", label: "Journey" },
  { name: "social", label: "Social" },
  { name: "profile", label: "Profile" },
] as const;

export default function TabsLayout() {
  const { applyPlayer, hydrateProfile, hydrateTaskContent, hydrateProgressionData, hydrateMilestones, hydrateSocialData } = useAppStore();
  const { ready, sessionExists } = useAuth();

  useEffect(() => {
    // Supabase restores its persisted session asynchronously on a full browser refresh.
    // Wait for that to finish before querying user-scoped data.
    if (!isSupabaseConfigured || !ready || !sessionExists) return;
    let mounted = true;
    async function bootstrap() {
      let remoteProfile: Awaited<ReturnType<typeof loadRemoteProfile>> = null;
      try {
        remoteProfile = await loadRemoteProfile();
        if (mounted && remoteProfile) hydrateProfile(remoteProfile);
      } catch {
        // Keep the portrait visible even if another profile field/query is unavailable.
        const user = (await supabase?.auth.getUser())?.data.user;
        if (mounted && user) {
          const avatar = await loadStoredAvatar(user.id);
          if (avatar) hydrateProfile({ ...useAppStore.getState().profile, id: user.id, avatar });
        }
      }

      if (!mounted) return;
      const [home, daily, social, progression, milestones] = await Promise.all([
        loadRemoteHomeData().catch(() => null),
        claimDailySurvivalRemote().catch(() => null),
        loadRemoteSocialBootstrap().catch(() => null),
        loadRemoteProgressionData().catch(() => null),
        loadRemoteMilestones().catch(() => null),
      ]);
      if (!mounted) return;
      if (home) { hydrateTaskContent(home.tasks, home.categories); applyPlayer({ ...home.player, level: getXpProgress(home.player.totalXp).level }); }
      if (daily?.awarded) { const totalXp = Number(daily.totalXp); applyPlayer({ ...useAppStore.getState().player, totalXp, level: getXpProgress(totalXp).level }); }
      if (social) hydrateSocialData(social.friends, social.requests, social.events);
      if (progression) hydrateProgressionData(progression.achievements, progression.titles);
      if (milestones) hydrateMilestones(milestones);
    }
    void bootstrap();
    return () => { mounted = false; };
  }, [applyPlayer, hydrateMilestones, hydrateProfile, hydrateProgressionData, hydrateSocialData, hydrateTaskContent, ready, sessionExists]);

  return <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
    <Tabs.Screen name="home" options={{ title: "Home" }} />
    <Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
    <Tabs.Screen name="phd" options={{ title: "Journey" }} />
    <Tabs.Screen name="social" options={{ title: "Social" }} />
    <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    <Tabs.Screen name="achievements" options={{ href: null }} />
    <Tabs.Screen name="journey" options={{ href: null }} />
  </Tabs>;
}

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}><View style={styles.bar}>
    {tabItems.map((item) => {
      const routeIndex = state.routes.findIndex((route) => route.name === item.name);
      if (routeIndex < 0) return null;
      const route = state.routes[routeIndex];
      const focused = state.index === routeIndex;
      const options = descriptors[route.key]?.options;
      const onPress = () => { if (!focused) navigation.navigate(route.name); };
      return <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={options?.tabBarAccessibilityLabel ?? item.label} accessibilityHint={`Go to ${item.label}`} onPress={onPress} style={({ pressed }) => [styles.item, focused && styles.itemSelected, pressed && styles.pressed]}>
        <TabIcon name={item.name} active={focused} />
        <Text style={[styles.label, focused && styles.labelSelected]}>{item.label}</Text>
      </Pressable>;
    })}
  </View></View>;
}

const styles = StyleSheet.create({
  outer: { backgroundColor: colors.background, paddingTop: spacing.xs },
  bar: { flexDirection: "row", gap: spacing.xs, marginHorizontal: spacing.sm, padding: spacing.xs, borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: colors.primary, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  item: { flex: 1, minHeight: componentHeight.tabBar - 8, borderRadius: radii.control, alignItems: "center", justifyContent: "center", paddingVertical: spacing.xs, minWidth: 44 },
  itemSelected: { backgroundColor: colors.mint, borderWidth: 1, borderColor: "#C9DDCD" },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: "700", marginTop: spacing.xs },
  labelSelected: { color: colors.secondary, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
