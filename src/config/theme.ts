import { Platform } from "react-native";
import { authColors } from "@/src/config/auth";

export const colors = {
  background: authColors.background,
  surface: authColors.surface,
  surfaceElevated: "#F2EEE4",
  primary: authColors.navy,
  secondary: authColors.green,
  accent: authColors.coral,
  textPrimary: authColors.textPrimary,
  textSecondary: authColors.textSecondary,
  border: authColors.border,
  success: authColors.green,
  warning: authColors.gold,
  error: authColors.error,
  ink: authColors.navy,
  muted: authColors.textSecondary,
  paper: authColors.background,
  cream: "#F0EBDF",
  lavender: "#E6EEE5",
  lavenderStrong: authColors.green,
  coral: authColors.coral,
  peach: "#F8E2DB",
  teal: authColors.green,
  mint: "#E3EFE5",
  gold: authColors.gold,
  line: authColors.border,
  white: authColors.surface,
  danger: authColors.error,
};

export const sectionTheme = {
  journey: {
    surface: colors.cream,
    surfaceStrong: "#F6E7BE",
    border: colors.gold,
    iconSurface: "#F6E7BE",
  },
  social: {
    surface: colors.primary,
    surfaceStrong: "#244874",
    border: "#3B5B82",
    iconSurface: "#2D4D76",
  },
} as const;

export const typography = {
  display: Platform.select({ ios: "Georgia-Bold", android: "serif", default: "Georgia" }),
  body: Platform.select({ ios: "System", android: "sans-serif", default: "sans-serif" }),
  screenTitle: 28,
  sectionTitle: 20,
  cardTitle: 16,
  bodySize: 15,
  metadata: 12,
  label: 11,
};

export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, hero: 40 };

export const screenPadding = 20;
export const componentHeight = { input: 50, button: 48, chip: 38, tabBar: 64, touchTarget: 44 };
export const iconSizes = { sm: 36, md: 44, lg: 52 };
export const borders = { width: 1, separator: 1 };
export const animationDuration = { press: 100, tab: 160, quick: 180, standard: 250, progress: 950, entrance: 190, reward: 520 };
export const shadows = { card: { shadowColor: authColors.navy, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 } };

export const radii = { small: 12, control: 14, card: 18, hero: 24, pill: 999 };
