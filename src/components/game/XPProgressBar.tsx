import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { animationDuration, colors, radii, spacing, typography } from "@/src/config/theme";
export function XPProgressBar({ current, next, percentage, hideMeta = false }: { current: number; next: number; percentage: number; hideMeta?: boolean }) {
  const [animatedProgress] = useState(() => new Animated.Value(percentage));

  useEffect(() => {
    const animation = Animated.timing(animatedProgress, {
      toValue: percentage,
      duration: animationDuration.progress,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, percentage]);

  const width = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return <View accessible accessibilityLabel={`${current} of ${next} XP`}>{hideMeta ? null : <View style={styles.meta}><Text style={styles.label}>XP PROGRESS</Text><Text style={styles.value}>{current} / {next} XP</Text></View>}<View style={styles.track}><Animated.View style={[styles.fill, { width }]} /></View></View>;
}
const styles = StyleSheet.create({ meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }, label: { color: colors.muted, fontWeight: "800", fontSize: typography.label - 1, letterSpacing: 1 }, value: { color: colors.ink, fontWeight: "800", fontSize: typography.metadata }, track: { height: 10, borderRadius: radii.pill, backgroundColor: colors.cream, overflow: "hidden" }, fill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.coral } });
