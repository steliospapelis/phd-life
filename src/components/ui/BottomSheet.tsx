import type { PropsWithChildren } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@/src/config/theme";

export function BottomSheet({ visible, title, onClose, children, size = "default", scrollable = false }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void; size?: "default" | "large"; scrollable?: boolean }>) {
  const content = <View style={styles.content}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View><Text style={styles.title} numberOfLines={2}>{title}</Text>{children}</View>;
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}><Pressable accessibilityLabel="Close details" style={styles.dismissArea} onPress={onClose} /><SafeAreaView edges={["bottom"]} style={[styles.sheet, size === "large" && styles.largeSheet]}>
      {scrollable ? <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView></View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(23, 52, 92, 0.42)" }, dismissArea: { flex: 1 }, sheet: { maxHeight: "92%", backgroundColor: colors.background, borderTopLeftRadius: radii.hero, borderTopRightRadius: radii.hero, overflow: "hidden" }, largeSheet: { maxHeight: "92%", minHeight: "86%" }, scroll: { flexGrow: 0 }, scrollContent: { flexGrow: 1 }, content: { padding: spacing.lg, paddingBottom: spacing.xl }, header: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: spacing.md }, title: { color: colors.ink, fontFamily: typography.display, fontSize: 28, lineHeight: 34, marginBottom: spacing.md }, close: { width: 35, height: 35, borderRadius: radii.control, backgroundColor: colors.cream, justifyContent: "center", alignItems: "center" }, closeText: { color: colors.ink, fontSize: 25, lineHeight: 27, fontWeight: "300" } });
