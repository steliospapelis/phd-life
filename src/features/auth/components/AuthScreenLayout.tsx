import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authColors } from "@/src/config/auth";

export function AuthScreenLayout({ children }: PropsWithChildren) {
  const { height } = useWindowDimensions();
  const shortScreen = height < 700;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, shortScreen && styles.shortScroll]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authColors.background },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center" },
  shortScroll: { paddingTop: 4 },
  content: { width: "100%", maxWidth: 480, paddingHorizontal: 20, paddingBottom: 32 },
});
