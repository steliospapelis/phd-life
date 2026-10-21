import { useState, type PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps, type StyleProp, type ViewStyle } from "react-native";
import { borders, colors, radii, spacing } from "@/src/config/theme";

type ScrollablePanelProps = PropsWithChildren<Pick<ScrollViewProps, "contentContainerStyle" | "nestedScrollEnabled" | "refreshControl"> & { style?: StyleProp<ViewStyle>; onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void; showScrollBar?: boolean }>;

export function ScrollablePanel({ children, style, contentContainerStyle, nestedScrollEnabled, refreshControl, onScroll, showScrollBar = true }: ScrollablePanelProps) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const canScroll = contentHeight > viewportHeight + 1;
  const thumbHeight = canScroll ? Math.max(28, (viewportHeight * viewportHeight) / contentHeight) : 0;
  const thumbTravel = Math.max(0, viewportHeight - thumbHeight);
  const scrollTravel = Math.max(1, contentHeight - viewportHeight);
  const thumbTop = canScroll ? Math.min(thumbTravel, (scrollY / scrollTravel) * thumbTravel) : 0;

  return (
    <View style={[styles.frame, style]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        onContentSizeChange={(_, contentSizeHeight) => setContentHeight(contentSizeHeight)}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        onScroll={(event) => { setScrollY(event.nativeEvent.contentOffset.y); onScroll?.(event); }}
        scrollEventThrottle={16}
        nestedScrollEnabled={nestedScrollEnabled}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {canScroll && showScrollBar ? <View pointerEvents="none" style={styles.track}><View style={[styles.thumb, { height: thumbHeight, transform: [{ translateY: thumbTop }] }]} /></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, minHeight: 0, position: "relative", overflow: "hidden" },
  scroll: { flex: 1, minHeight: 0 },
  content: { flexGrow: 1, paddingRight: spacing.xs },
  track: { position: "absolute", top: spacing.sm, right: 5, bottom: spacing.sm, width: borders.width + 4, borderRadius: radii.pill, backgroundColor: "#DDE7DC" },
  thumb: { width: borders.width + 4, borderRadius: radii.pill, backgroundColor: colors.secondary },
});
