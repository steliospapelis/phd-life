import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, iconSizes, radii, spacing, typography } from "@/src/config/theme";

export function EmptyState({ title, message, icon }: { title: string; message: string; icon?: ReactNode }) {
  return (
    <View accessible style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  icon: { width: iconSizes.md, height: iconSizes.md, borderRadius: radii.control, backgroundColor: colors.peach, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  title: { color: colors.primary, fontSize: typography.cardTitle, fontWeight: "900", textAlign: "center" },
  message: { color: colors.textSecondary, fontSize: typography.metadata, lineHeight: 18, textAlign: "center", marginTop: spacing.xs, maxWidth: 280 },
});
