import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AvatarAssetPicker } from "@/src/components/avatar/AvatarAssetPicker";
import { AvatarRenderer } from "@/src/components/avatar/AvatarRenderer";
import { Button } from "@/src/components/ui/Button";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import type { AvatarConfig } from "@/src/types/models";

type CharacterBuilderSheetProps = {
  visible: boolean;
  value: AvatarConfig;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: AvatarConfig) => Promise<void>;
};

const backgroundOptions = [
  { label: "Mint", color: "#E3EFE5" },
  { label: "Cream", color: "#F0EBDF" },
  { label: "Sky", color: "#DDEAF2" },
  { label: "Peach", color: "#F8E2DB" },
  { label: "Lavender", color: "#E6EEE5" },
  { label: "Gold", color: "#F7E6B5" },
  { label: "Sky blue", color: "#CFE3F2" },
  { label: "Rose", color: "#F2C8D4" },
  { label: "Lilac", color: "#DCD2EF" },
  { label: "Navy", color: "#C8D4E7" },
];

export function CharacterBuilderSheet({ visible, value, saving = false, onClose, onSave }: CharacterBuilderSheetProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // The sheet is intentionally reset when it opens so preview edits do not leak between sessions.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(value);
      setError(null);
    }
  }, [value, visible]);

  async function save() {
    setError(null);
    try {
      await onSave(draft);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save your character. Try again.");
    }
  }

  return <BottomSheet visible={visible} title="Build your character" onClose={onClose} size="large" scrollable>
    <View style={styles.actions}>
      <Text style={styles.helper}>Changes stay in preview until you save.</Text>
      <Button label={saving ? "Saving…" : "Save"} disabled={saving} onPress={() => void save()} style={styles.saveButton} />
    </View>
    <View style={[styles.preview, { backgroundColor: draft.backgroundColor ?? colors.mint }]} accessible accessibilityLabel="Live character preview">
      <AvatarRenderer config={draft} size={150} />
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    <View style={styles.backgroundPicker}>
      <Text style={styles.backgroundLabel}>Avatar background</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatches}>{backgroundOptions.map((option) => {
        const selected = (draft.backgroundColor ?? colors.mint) === option.color;
        return <Pressable key={option.color} accessibilityRole="button" accessibilityLabel={option.label + " avatar background"} accessibilityState={{ selected }} onPress={() => setDraft({ ...draft, backgroundColor: option.color })} style={[styles.swatch, { backgroundColor: option.color }, selected && styles.swatchSelected]} />;
      })}</ScrollView>
    </View>
    <AvatarAssetPicker value={draft} onChange={setDraft} showHeading={false} />
  </BottomSheet>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  helper: { color: colors.muted, fontSize: typography.metadata, lineHeight: 17, flex: 1 },
  saveButton: { minHeight: 44, paddingHorizontal: spacing.lg },
  preview: { minHeight: 164, borderRadius: radii.hero, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  error: { color: colors.coral, backgroundColor: colors.peach, borderRadius: radii.control, padding: spacing.sm, marginBottom: spacing.sm, fontSize: typography.metadata, fontWeight: "800" },
  backgroundPicker: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radii.control, padding: spacing.sm, marginBottom: spacing.sm },
  backgroundLabel: { color: colors.primary, fontSize: typography.metadata, fontWeight: "900", marginBottom: spacing.sm },
  swatches: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: 2, paddingVertical: 3 },
  swatch: { width: 32, height: 32, borderRadius: radii.pill, borderWidth: 2, borderColor: colors.white },
  swatchSelected: { borderColor: colors.primary, transform: [{ scale: 1.12 }] },
});
