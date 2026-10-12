import { createElement, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Animated, PanResponder, Platform, StyleSheet, Text, View, type GestureResponderEvent, type PanResponderGestureState } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radii } from "@/src/config/theme";
import { clampSanity, getSanityState } from "@/src/domain/game";

const webInputStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
  touchAction: "none",
  margin: 0,
  padding: 0,
  zIndex: 2,
};

type SanityMeterProps = {
  sanity: number;
  editable?: boolean;
  disabled?: boolean;
  onChange?: (sanity: number) => void;
  onCommit?: (sanity: number) => void;
};

export function SanityMeter({ sanity, editable = false, disabled = false, onChange, onCommit }: SanityMeterProps) {
  const normalized = clampSanity(sanity);
  const sanityState = getSanityState(normalized);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const [pressed, setPressed] = useState(false);
  const currentValue = useRef(normalized);
  const startValue = useRef(normalized);
  const startLocation = useRef(0);
  const didMove = useRef(false);
  const isDragging = useRef(false);
  const lastHapticAt = useRef(0);
  // Animated.Value must remain stable between renders so the thumb can animate independently of React state.
  // eslint-disable-next-line react-hooks/refs
  const animatedValue = useRef(new Animated.Value(normalized)).current;

  useEffect(() => {
    if (isDragging.current) return;
    currentValue.current = normalized;
    const animation = Animated.timing(animatedValue, { toValue: normalized, duration: 220, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [animatedValue, normalized]);

  const emitValue = useCallback((next: number, animate = false) => {
    const value = clampSanity(next);
    const previous = currentValue.current;
    currentValue.current = value;
    if (editable && value !== previous) {
      const previousState = getSanityState(previous).key;
      const nextState = getSanityState(value).key;
      const now = Date.now();
      if (previousState !== nextState && now - lastHapticAt.current > 280) {
        lastHapticAt.current = now;
        void Haptics.selectionAsync().catch(() => undefined);
      }
    }
    if (animate) {
      Animated.timing(animatedValue, { toValue: value, duration: 150, useNativeDriver: false }).start();
    } else {
      animatedValue.setValue(value);
    }
    onChange?.(value);
  }, [animatedValue, editable, onChange]);

  const handleGrant = useCallback((event: GestureResponderEvent) => {
    if (!trackWidthRef.current) return;
    startLocation.current = event.nativeEvent.locationX;
    startValue.current = currentValue.current;
    didMove.current = false;
    isDragging.current = true;
    setPressed(true);
  }, []);

  const handleMove = useCallback((_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    const width = trackWidthRef.current;
    if (!width) return;
    if (Math.abs(gestureState.dx) < 3) return;
    didMove.current = true;
    emitValue(startValue.current + Math.round((gestureState.dx / width) * 100));
  }, [emitValue]);

  const handleRelease = useCallback((_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    const width = trackWidthRef.current;
    if (!width) return;
    if (!didMove.current) {
      emitValue(Math.round((startLocation.current / width) * 100), true);
    }
    isDragging.current = false;
    setPressed(false);
    onCommit?.(currentValue.current);
  }, [emitValue, onCommit]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleWebSliderStart = useCallback(() => {
    if (!editable || disabled) return;
    isDragging.current = true;
    setPressed(true);
  }, [disabled, editable]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleWebSliderChange = useCallback((event: { currentTarget: { value: string } }) => {
    if (!editable || disabled) return;
    isDragging.current = true;
    setPressed(true);
    emitValue(Number(event.currentTarget.value));
  }, [disabled, editable, emitValue]);

  const handleWebSliderEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setPressed(false);
    onCommit?.(currentValue.current);
  }, [onCommit]);

  // PanResponder callbacks run outside render, so refs keep the latest drag value without re-rendering on every pointer event.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = useMemo(() => Platform.OS === "web" ? ({ panHandlers: {} } as ReturnType<typeof PanResponder.create>) : PanResponder.create({
    onStartShouldSetPanResponder: () => editable && !disabled,
    onMoveShouldSetPanResponder: (_, gestureState) => editable && !disabled && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderGrant: handleGrant,
    onPanResponderMove: handleMove,
    onPanResponderRelease: handleRelease,
    onPanResponderTerminate: handleRelease,
  }), [disabled, editable, handleGrant, handleMove, handleRelease]);

  const handleAccessibilityAction = useCallback((event: { nativeEvent: { actionName: string } }) => {
    if (!editable || disabled) return;
    const delta = event.nativeEvent.actionName === "increment" ? 5 : event.nativeEvent.actionName === "decrement" ? -5 : 0;
    if (!delta) return;
    const next = clampSanity(normalized + delta);
    emitValue(next, true);
    onCommit?.(next);
  }, [disabled, editable, emitValue, normalized, onCommit]);

  // eslint-disable-next-line react-hooks/refs
  const thumbPosition = animatedValue.interpolate({ inputRange: [0, 100], outputRange: [0, trackWidth] });
  // eslint-disable-next-line react-hooks/refs
  const fillWidth = animatedValue.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return <View
    accessible
    accessibilityRole={editable ? "adjustable" : undefined}
    accessibilityLabel="Sanity"
    accessibilityValue={{ min: 0, max: 100, now: normalized, text: `${normalized} out of 100, ${sanityState.label}` }}
    accessibilityActions={editable ? [{ name: "increment", label: "Increase sanity" }, { name: "decrement", label: "Decrease sanity" }] : undefined}
    onAccessibilityAction={editable ? handleAccessibilityAction : undefined}
  >
    <View style={styles.row}><View style={styles.valueGroup}><Text style={styles.label}>SANITY</Text><Text style={styles.value}>{normalized} / 100</Text></View><Text style={styles.stateLabel}>{sanityState.label}</Text></View>
    <View onLayout={(event) => { const width = event.nativeEvent.layout.width; trackWidthRef.current = width; setTrackWidth(width); }} style={[styles.touchTarget, disabled && styles.trackDisabled]} {...(editable && Platform.OS !== "web" ? panResponder.panHandlers : {})}>
      <View style={styles.track}><Animated.View style={[styles.fill, { width: fillWidth }]} /></View>
      {editable ? <Animated.View pointerEvents="none" style={[styles.thumb, { left: thumbPosition, transform: [{ translateX: -12 }, { scale: pressed ? 1.12 : 1 }] }]} /> : null}
      {/* eslint-disable-next-line react-hooks/refs */}
      {editable && Platform.OS === "web" ? createElement("input", {
        type: "range",
        min: 0,
        max: 100,
        step: 1,
        value: normalized,
        disabled,
        "aria-label": "Sanity",
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": normalized,
        onMouseDown: handleWebSliderStart,
        onTouchStart: handleWebSliderStart,
        onChange: handleWebSliderChange,
        onMouseUp: handleWebSliderEnd,
        onTouchEnd: handleWebSliderEnd,
        onBlur: handleWebSliderEnd,
        style: webInputStyle,
      }) : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 1 },
  valueGroup: { flexDirection: "row", alignItems: "center", gap: 7 },
  label: { color: colors.muted, fontWeight: "800", fontSize: 10, letterSpacing: 1 },
  value: { color: colors.ink, fontWeight: "800", fontSize: 13 },
  touchTarget: { height: 32, justifyContent: "center", position: "relative" },
  track: { height: 10, borderRadius: radii.pill, backgroundColor: colors.cream, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.teal },
  trackDisabled: { opacity: 0.6 },
  thumb: { position: "absolute", top: 4, width: 24, height: 24, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.secondary, shadowColor: colors.primary, shadowOpacity: 0.16, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  stateLabel: { color: colors.secondary, fontSize: 11, fontWeight: "900", textAlign: "right" },
});
