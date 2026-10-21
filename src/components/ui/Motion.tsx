import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { AccessibilityInfo, Animated, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useFocusEffect } from "expo-router";
import { animationDuration } from "@/src/config/theme";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (mounted) setReduced(enabled); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return reduced;
}

export function FocusFade({ children, delay = 0, distance = 8, style }: PropsWithChildren<{ delay?: number; distance?: number; style?: StyleProp<ViewStyle> }>) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useFocusEffect(useCallback(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return undefined;
    }
    opacity.setValue(0);
    translateY.setValue(distance);
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: animationDuration.entrance, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: animationDuration.entrance, delay, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, distance, opacity, reducedMotion, translateY]));

  return <Animated.View style={[styles.fill, { opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

export function RewardToast({ visible, children, style }: PropsWithChildren<{ visible: boolean; style?: StyleProp<ViewStyle> }>) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(10);
      return undefined;
    }
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return undefined;
    }
    opacity.setValue(0);
    translateY.setValue(10);
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: animationDuration.quick, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: animationDuration.reward, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion, translateY, visible]);

  if (!visible) return null;
  return <Animated.View accessibilityLiveRegion="polite" style={[styles.fill, { opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

export function AnimatedProgressFill({ percentage, style }: { percentage: number; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const normalized = Math.max(0, Math.min(100, percentage));

  useEffect(() => {
    progress.stopAnimation();
    if (reducedMotion) {
      progress.setValue(normalized);
      return undefined;
    }
    const animation = Animated.timing(progress, { toValue: normalized, duration: animationDuration.progress, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [normalized, progress, reducedMotion]);

  const width = progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return <Animated.View style={[styles.progressFill, { width }, style]} />;
}

export function UnlockPulse({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scale.stopAnimation();
    scale.setValue(1);
    if (reducedMotion) return undefined;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.025, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, scale]);

  return <Animated.View style={[styles.fill, { transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({ fill: { width: "100%" }, progressFill: { height: "100%" } });
