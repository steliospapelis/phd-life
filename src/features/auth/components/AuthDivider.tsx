import { StyleSheet, Text, View } from "react-native";
import { authColors } from "@/src/config/auth";

export function AuthDivider() {
  return <View style={styles.row}><View style={styles.line} /><Text style={styles.text}>or continue with</Text><View style={styles.line} /></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  line: { flex: 1, height: 1, backgroundColor: authColors.border },
  text: { color: authColors.textSecondary, fontSize: 12 },
});

