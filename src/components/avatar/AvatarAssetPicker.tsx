import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { avatarAssetOptions, type AvatarPart } from "@/src/config/avatarAssets";
import { colors, radii, spacing } from "@/src/config/theme";
import type { AvatarConfig } from "@/src/types/models";

const parts: { key: AvatarPart; label: string; configKey: "headId" | "hairId" | "eyesId" | "mouthId" }[] = [
  { key: "heads", label: "Heads", configKey: "headId" },
  { key: "hair", label: "Hair", configKey: "hairId" },
  { key: "eyes", label: "Eyes", configKey: "eyesId" },
  { key: "mouths", label: "Mouths", configKey: "mouthId" },
];

export function AvatarAssetPicker({ value, onChange, showHeading = true }: { value: AvatarConfig; onChange: (value: AvatarConfig) => void; showHeading?: boolean }) {
  const [part, setPart] = useState<AvatarPart>("heads");
  const selectedPart = parts.find((item) => item.key === part) ?? parts[0];
  const selectedId = value[selectedPart.configKey];

  return <View style={styles.container}>
    {showHeading ? <View style={styles.heading}><Text style={styles.eyebrow}>BUILD YOUR CHARACTER</Text><Text style={styles.hint}>Mix and match your research sidekick.</Text></View> : null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partTabs}>
      {parts.map((item) => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: item.key === part }} onPress={() => setPart(item.key)} style={[styles.partTab, item.key === part && styles.partTabSelected]}><Text style={[styles.partTabText, item.key === part && styles.partTabTextSelected]}>{item.label}</Text></Pressable>)}
    </ScrollView>
    <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.options} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {avatarAssetOptions[part].map((option) => { const selected = itemSelected(option.id, selectedId); return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${option.label}, ${selected ? "selected" : "not selected"}`} onPress={() => onChange({ ...value, [selectedPart.configKey]: option.id })} style={[styles.option, selected && styles.optionSelected]}><View style={styles.optionPreview}><Image source={option.source} resizeMode="contain" style={styles.optionImage} /></View>{selected ? <View style={styles.check}><Text style={styles.checkText}>✓</Text></View> : null}<Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text></Pressable>; })}
    </ScrollView>
  </View>;
}

function itemSelected(optionId: string, selectedId?: string) { return optionId === selectedId; }

const styles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radii.card, padding: spacing.md },
  heading: { marginBottom: spacing.md },
  eyebrow: { color: colors.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  partTabs: { gap: 7, paddingBottom: 10 },
  partTab: { minHeight: 34, borderRadius: radii.pill, paddingHorizontal: spacing.md, justifyContent: "center", backgroundColor: colors.cream },
  partTabSelected: { backgroundColor: colors.ink },
  partTabText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  partTabTextSelected: { color: colors.white },
  optionsScroll: { maxHeight: 420 },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm, paddingBottom: 2 },
  option: { width: "31%", minHeight: 96, alignItems: "center", borderRadius: radii.control, padding: spacing.xs, borderWidth: 2, borderColor: "transparent", position: "relative" },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.peach },
  optionPreview: { width: 66, height: 66, borderRadius: radii.small, backgroundColor: colors.cream, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  optionImage: { width: 66, height: 66 },
  optionLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", marginTop: 4 },
  optionLabelSelected: { color: colors.coral },
  check: { position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: radii.pill, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  checkText: { color: colors.surface, fontSize: 12, fontWeight: "900" },
});
