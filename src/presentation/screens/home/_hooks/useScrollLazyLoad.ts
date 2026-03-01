/**
 * useScrollLazyLoad - 스크롤 기반 레이지 로드 훅
 *
 * 특정 컴포넌트가 뷰포트에 진입할 때 로드를 트리거합니다.
 * Reanimated를 사용하여 UI 스레드에서 스크롤 감지를 수행합니다.
 *
 * @example
 * const { scrollHandler, isVisible, handleContainerLayout, handleTargetLayout } = useScrollLazyLoad();
 *
 * <Container onLayout={handleContainerLayout}>
 *   <Animated.ScrollView onScroll={scrollHandler}>
 *     <View onLayout={handleTargetLayout}>
 *       <LazyComponent isVisible={isVisible} />
 *     </View>
 *   </Animated.ScrollView>
 * </Container>
 */

import { useCallback, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

/** 뷰포트 진입 판단 여유값 (px) */
const VIEWPORT_THRESHOLD = 200;

interface UseScrollLazyLoadReturn {
  /** 스크롤 핸들러 (Animated.ScrollView에 전달) */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  /** 스크롤 Y 값 (SharedValue) */
  scrollY: ReturnType<typeof useSharedValue<number>>;
  /** 타겟이 뷰포트에 진입했는지 여부 */
  isVisible: boolean;
  /** 컨테이너 레이아웃 핸들러 (뷰포트 높이 측정) */
  handleContainerLayout: (event: LayoutChangeEvent) => void;
  /** 타겟 레이아웃 핸들러 (타겟 Y 위치 측정) */
  handleTargetLayout: (event: LayoutChangeEvent) => void;
}

export function useScrollLazyLoad(): UseScrollLazyLoadReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const targetY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const isTriggered = useSharedValue(false);

  // 컨테이너 레이아웃 측정 (뷰포트 높이)
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  // 타겟 레이아웃 측정 (Y 위치)
  const handleTargetLayout = useCallback(
    (event: LayoutChangeEvent) => {
      targetY.value = event.nativeEvent.layout.y;
    },
    [targetY],
  );

  // 로드 트리거 함수
  const triggerLoad = useCallback(() => {
    setIsVisible(true);
  }, []);

  // 스크롤 핸들러
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 스크롤 위치 감지하여 레이지 로드 트리거
  useAnimatedReaction(
    () => ({ scroll: scrollY.value, target: targetY.value }),
    ({ scroll: currentScrollY, target: currentTargetY }) => {
      if (isTriggered.value) return;
      if (currentTargetY <= 0 || viewportHeight <= 0) return;

      const triggerPoint = currentTargetY - viewportHeight - VIEWPORT_THRESHOLD;
      if (currentScrollY >= triggerPoint) {
        isTriggered.value = true;
        runOnJS(triggerLoad)();
      }
    },
    [viewportHeight],
  );

  return {
    scrollHandler,
    scrollY,
    isVisible,
    handleContainerLayout,
    handleTargetLayout,
  };
}
