import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/config/theme";

export default function AuthCallback() {
  const { ready, sessionExists } = useAuth();

  useEffect(() => {
    if (ready && sessionExists) router.replace("/");
  }, [ready, sessionExists]);

  return <View style={styles.container}><ActivityIndicator color={colors.coral} /><Text style={styles.text}>{ready ? "Email confirmed. Opening PhD Life…" : "Confirming your email…"}</Text></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }, text: { color: colors.primary, fontSize: 15, textAlign: "center" } });
