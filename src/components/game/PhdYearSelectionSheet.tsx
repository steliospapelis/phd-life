import { Text, View } from "react-native";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { Chip } from "@/src/components/ui/Chip";
import { colors, spacing, typography } from "@/src/config/theme";

export function PhdYearSelectionSheet({ visible, value, busy, onSelect, onClose }: { visible: boolean; value: number; busy: boolean; onSelect: (year: number) => void; onClose: () => void }) {
  return <BottomSheet visible={visible} title="Update your PhD year" onClose={onClose}>
    <Text style={styles.helper}>Your year advances automatically every September 1. You can correct it here whenever life, paperwork, or academia gets creative.</Text>
    <View style={styles.yearRow}>{[1, 2, 3, 4, 5, 6, 7, 8].map((year) => <Chip key={year} label={year === 8 ? "8+" : `Year ${year}`} selected={value === year} onPress={() => { if (!busy) onSelect(year); }} />)}</View>
  </BottomSheet>;
}

const styles = {
  helper: { color: colors.textSecondary, fontSize: typography.metadata, lineHeight: 18, marginBottom: spacing.md },
  yearRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: spacing.xs },
};
