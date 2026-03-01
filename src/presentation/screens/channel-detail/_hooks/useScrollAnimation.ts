import { useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';

interface UseScrollAnimationReturn {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  gradientAnimatedStyle: AnimatedStyle<{ opacity: number }>;
  appBarOpacity: SharedValue<number>;
}

const SCROLL_THRESHOLD = 26;
const ANIMATION_DURATION = 300;
const OPACITY_THRESHOLD = 0.01;

export function useScrollAnimation(): UseScrollAnimationReturn {
  const appBarOpacity = useSharedValue(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      const targetOpacity = offset >= SCROLL_THRESHOLD ? 1.0 : 0.0;
      const currentOpacity = appBarOpacity.value;
      const needsUpdate = Math.abs(currentOpacity - targetOpacity) > OPACITY_THRESHOLD;

      if (needsUpdate) {
        appBarOpacity.value = withTiming(targetOpacity, { duration: ANIMATION_DURATION });
      }
    },
    [appBarOpacity],
  );

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: appBarOpacity.value,
  }));

  return {
    handleScroll,
    gradientAnimatedStyle,
    appBarOpacity,
  };
}
