import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, screenPadding, spacing } from "@/src/config/theme";

export function Screen({ children, scroll = true, style, refreshing = false, onRefresh, onScroll }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle; refreshing?: boolean; onRefresh?: () => void; onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void }>) {
  const { width } = useWindowDimensions();
  const content = <View style={[styles.content, { paddingHorizontal: width <= 340 ? spacing.base : screenPadding }, !scroll && styles.fixedContent, style]}>{children}</View>;
  return <SafeAreaView style={styles.safe} edges={["top"]}>
    {scroll ? <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} /> : undefined}>{content}</ScrollView>
    </KeyboardAvoidingView> : content}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, keyboard: { flex: 1 }, scroll: { flexGrow: 1 }, content: { width: "100%", maxWidth: 600, alignSelf: "center", paddingBottom: spacing.hero }, fixedContent: { flex: 1, minHeight: 0 } });
