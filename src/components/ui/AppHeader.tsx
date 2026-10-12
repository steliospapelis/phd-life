import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/src/config/theme";

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function AppHeader({ eyebrow, title, subtitle, action }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function HeaderAction({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
    >
      <Text style={styles.headerActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.lg },
  copy: { flex: 1, minWidth: 0 },
  action: { flexShrink: 0, paddingTop: spacing.sm },
  eyebrow: { color: colors.accent, fontSize: typography.label, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: colors.primary, fontFamily: typography.display, fontSize: typography.screenTitle, lineHeight: 31, marginTop: spacing.xs },
  subtitle: { color: colors.textSecondary, fontSize: typography.bodySize, lineHeight: 21, marginTop: spacing.xs },
  headerAction: { minHeight: 44, paddingHorizontal: spacing.sm, borderRadius: radii.control, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerActionText: { color: colors.primary, fontSize: typography.metadata, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
