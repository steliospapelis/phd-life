import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { colors, radii, spacing, typography } from "@/src/config/theme";
import { isTitleUnlocked, titleRequirement } from "@/src/domain/titleUtils";
import type { Title } from "@/src/types/models";

type TitleSelectionSheetProps = {
  visible: boolean;
  titles: Title[];
  level: number;
  selectedTitle: string;
  busyId: string | null;
  notice?: string | null;
  onSelect: (title: Title) => void;
  onClose: () => void;
};

export function TitleSelectionSheet({ visible, titles, level, selectedTitle, busyId, notice, onSelect, onClose }: TitleSelectionSheetProps) {
  return <BottomSheet visible={visible} title="Choose your title" onClose={onClose} size="large" scrollable>
    <Text style={styles.helper}>Pick the name that best describes today’s academic survival mode.</Text>
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    <View style={styles.list}>
      {titles.map((title) => {
        const unlocked = isTitleUnlocked(title, level);
        const selected = title.name === selectedTitle;
        return <Pressable
          key={title.id}
          accessibilityRole="button"
          accessibilityLabel={selected ? title.name + ", selected title" : unlocked ? "Equip " + title.name : title.name + ", locked, " + titleRequirement(title)}
          accessibilityState={{ selected, disabled: Boolean(busyId) && busyId !== title.id }}
          onPress={() => onSelect(title)}
          style={({ pressed }) => [styles.row, selected && styles.selected, !unlocked && styles.locked, pressed && styles.pressed]}
        >
          <View style={[styles.marker, selected && styles.markerSelected]}><Text style={styles.markerText}>{selected ? "✓" : unlocked ? "→" : "🔒"}</Text></View>
          <View style={styles.copy}><Text style={[styles.name, !unlocked && styles.lockedText]} numberOfLines={1}>{title.name}</Text><Text style={[styles.requirement, !unlocked && styles.lockedText]} numberOfLines={1}>{selected ? "Selected" : titleRequirement(title)}</Text></View>
          {busyId === title.id ? <Text style={styles.saving}>Saving…</Text> : null}
        </Pressable>;
      })}
    </View>
  </BottomSheet>;
}

const styles = StyleSheet.create({
  helper: { color: colors.textSecondary, fontSize: typography.metadata, lineHeight: 18, marginBottom: spacing.sm },
  notice: { color: colors.secondary, backgroundColor: colors.mint, borderRadius: radii.control, padding: spacing.sm, marginBottom: spacing.sm, fontSize: typography.metadata, fontWeight: "800" },
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border, borderRadius: radii.control, padding: spacing.sm },
  selected: { backgroundColor: colors.mint, borderColor: colors.secondary, borderWidth: 2 },
  locked: { opacity: 0.68 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.84 },
  marker: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  markerSelected: { backgroundColor: colors.secondary },
  markerText: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  requirement: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
  lockedText: { color: colors.muted },
  saving: { color: colors.secondary, fontSize: 10, fontWeight: "900" },
});
