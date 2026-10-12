import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { authColors } from "@/src/config/auth";

export function AuthPrimaryButton({ label, loading, loadingLabel = "Working…", onPress, disabled }: { label: string; loading?: boolean; loadingLabel?: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {loading ? <><ActivityIndicator color={authColors.surface} size="small" /><Text style={styles.loadingText}>{loadingLabel}</Text></> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: authColors.green },
  pressed: { backgroundColor: "#4C6D51" },
  disabled: { backgroundColor: authColors.sage },
  text: { color: authColors.surface, fontSize: 16, fontWeight: "800" },
  loadingText: { color: authColors.surface, fontSize: 14, fontWeight: "800", marginTop: 3 },
});
