import { Image, StyleSheet } from "react-native";
import { authAssets } from "@/src/config/authAssets";

export function PhdLifeLogo({ size = "large" }: { size?: "large" | "small" }) {
  const compact = size === "small";

  return <Image accessible accessibilityLabel="PhD Life logo" source={authAssets.logo} resizeMode="contain" style={compact ? styles.small : styles.large} />;
}

const styles = StyleSheet.create({
  large: { width: 190, height: 145 },
  small: { width: 132, height: 96 },
});
