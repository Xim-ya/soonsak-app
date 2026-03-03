import { useState, useRef, useMemo, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * useImageTransition - 이미지 전환 애니메이션을 관리하는 훅
 *
 * 두 이미지 간의 크로스페이드 전환 효과를 제공합니다.
 *
 * @returns 애니메이션 상태와 제어 함수들
 */
export function useImageTransition() {
  const [showSecondary, setShowSecondary] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 애니메이션 토글 함수
  const toggleImages = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: showSecondary ? 0 : 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    setShowSecondary(!showSecondary);
  }, [fadeAnim, showSecondary]);

  // 강제로 secondary 상태로 전환 (다른 영상 클릭 시 사용)
  const switchToSecondary = useCallback(() => {
    if (!showSecondary) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      setShowSecondary(true);
    }
  }, [fadeAnim, showSecondary]);

  // opacity 값들 메모이제이션
  const opacityValues = useMemo(
    () => ({
      primary: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      secondary: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    }),
    [fadeAnim],
  );

  return {
    showSecondary,
    toggleImages,
    switchToSecondary,
    opacityValues,
  };
}
