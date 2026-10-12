import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/src/config/theme";

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View accessibilityLabel="Loading" style={styles.container}>
      {Array.from({ length: lines }, (_, index) => <View key={index} style={[styles.line, index === lines - 1 && styles.short]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  line: { height: 12, width: "100%", borderRadius: radii.control, backgroundColor: colors.surfaceElevated },
  short: { width: "64%" },
});
