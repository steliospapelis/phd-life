import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authColors } from "@/src/config/auth";

export function AuthScreenLayout({ children }: PropsWithChildren) {
  const { height } = useWindowDimensions();
  const shortScreen = height < 700;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.content, shortScreen && styles.shortContent]}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authColors.background },
  keyboard: { flex: 1 },
  content: { width: "100%", maxWidth: 480, flex: 1, paddingHorizontal: 20, paddingBottom: 24, alignSelf: "center" },
  shortContent: { paddingTop: 4, paddingBottom: 12 },
});
