/**
 * useShimmerAnimation - Shimmer 스켈레톤 애니메이션 훅
 *
 * 이미지 로딩 중 표시되는 shimmer 효과를 제공합니다.
 * Reanimated를 사용하여 네이티브 스레드에서 실행됩니다.
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { SHIMMER } from '../imageConstants';

export function useShimmerAnimation() {
  const progress = useSharedValue(0);

  // progress는 stable한 sharedValue이므로 의존성 배열 비움
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const start = useCallback(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER.duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stop = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: SHIMMER.minOpacity + progress.value * (SHIMMER.maxOpacity - SHIMMER.minOpacity),
  }));

  return { start, stop, shimmerStyle };
}
