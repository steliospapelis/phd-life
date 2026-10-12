import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { borders, colors, radii, spacing } from "@/src/config/theme";

export function Card({ children, style, tone = "surface" }: PropsWithChildren<{ style?: ViewStyle; tone?: "surface" | "mint" | "navy" | "cream" }>) {
  return <View style={[styles.base, styles[tone], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.card, borderWidth: borders.width, borderColor: colors.border, padding: spacing.md },
  surface: { backgroundColor: colors.surface },
  mint: { backgroundColor: colors.mint, borderColor: "#C9DDCD" },
  navy: { backgroundColor: colors.primary, borderColor: colors.primary },
  cream: { backgroundColor: colors.cream, borderColor: colors.border },
});
