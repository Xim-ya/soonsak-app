/**
 * InteractiveStarRating - 인터랙티브 별점 선택 컴포넌트
 *
 * 두 가지 모드 지원:
 * - tap: 별을 탭하여 선택 (필터용)
 * - drag: 드래그/터치로 0.5 단위 선택 (평점 등록용)
 *
 * react-native-gesture-handler를 사용하여 ScrollView 내부에서도
 * 드래그 모드가 정상 작동합니다.
 *
 * @example
 * // 필터용 (1~5 정수, 탭)
 * <InteractiveStarRating
 *   value={selectedRating}
 *   onChange={setSelectedRating}
 *   mode="tap"
 *   step={1}
 * />
 *
 * // 평점 등록용 (0.5~5.0, 드래그)
 * <InteractiveStarRating
 *   value={rating}
 *   onChange={setRating}
 *   mode="drag"
 *   step={0.5}
 *   size={28}
 * />
 */

import React, { useCallback, useRef, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import styled from '@emotion/native';
import StarBlankSvg from '@assets/icons/star_blank.svg';
import StarFilledSvg from '@assets/icons/star_filled.svg';
import StarHalfSvg from '@assets/icons/star_half.svg';

const TOTAL_STARS = 5;

interface InteractiveStarRatingProps {
  /** 현재 별점 값 (null = 미선택) */
  readonly value: number | null;
  /** 별점 변경 콜백 */
  readonly onChange: (rating: number | null) => void;
  /** 별 크기 (기본 28) */
  readonly size?: number;
  /** 별 간격 (기본 6) */
  readonly gap?: number;
  /** 선택 단위 (기본 0.5) */
  readonly step?: 0.5 | 1;
  /** 인터랙션 모드 (기본 tap) */
  readonly mode?: 'tap' | 'drag';
  /** 평점 선택 완료 시 콜백 - 드래그 또는 탭 종료 시 호출 (mode="drag"에서만 사용) */
  readonly onRatingComplete?: (rating: number) => void;
}

function InteractiveStarRating({
  value,
  onChange,
  size = 28,
  gap = 6,
  step = 0.5,
  mode = 'tap',
  onRatingComplete,
}: InteractiveStarRatingProps): React.ReactElement {
  const containerRef = useRef<View>(null);
  const [containerLayout, setContainerLayout] = useState({ x: 0, width: 0 });

  // 레이아웃 측정
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    containerRef.current?.measureInWindow((x) => {
      setContainerLayout({ x, width });
    });
  }, []);

  // 터치 위치로 별점 계산
  const calculateRatingFromPosition = useCallback(
    (absoluteX: number): number => {
      // 레이아웃 미측정 시 최소값 반환 (도메인 밖 값 방지)
      if (containerLayout.width === 0) return step === 0.5 ? 0.5 : 1;

      const relativeX = absoluteX - containerLayout.x;
      const starWidth = size + gap;
      const totalWidth = starWidth * TOTAL_STARS - gap;

      if (relativeX <= 0) return step === 0.5 ? 0.5 : 1;
      if (relativeX >= totalWidth) return 5;

      const starIndex = Math.floor(relativeX / starWidth);
      const positionInStar = relativeX - starIndex * starWidth;

      if (step === 0.5) {
        const halfPoint = size / 2;
        if (positionInStar <= halfPoint) {
          return starIndex + 0.5;
        }
        return starIndex + 1;
      }

      // step === 1
      return starIndex + 1;
    },
    [containerLayout, size, gap, step],
  );

  // 탭 모드: 개별 별 클릭
  const handleStarPress = useCallback(
    (starValue: number) => {
      if (mode !== 'tap') return;
      // 같은 별 다시 누르면 해제
      if (value === starValue) {
        onChange(null);
      } else {
        onChange(starValue);
      }
    },
    [mode, value, onChange],
  );

  // 드래그 중 별점 업데이트 (JS 스레드에서 실행)
  const handleDragUpdate = useCallback(
    (absoluteX: number) => {
      const rating = calculateRatingFromPosition(absoluteX);
      onChange(rating);
    },
    [calculateRatingFromPosition, onChange],
  );

  // 평점 선택 완료 처리 (JS 스레드에서 실행)
  const handleRatingCompleteCallback = useCallback(
    (absoluteX: number) => {
      const rating = calculateRatingFromPosition(absoluteX);
      onRatingComplete?.(rating);
    },
    [calculateRatingFromPosition, onRatingComplete],
  );

  // 드래그 제스처 (react-native-gesture-handler 사용)
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      if (mode !== 'drag') return;
      runOnJS(handleDragUpdate)(event.absoluteX);
    })
    .onUpdate((event) => {
      if (mode !== 'drag') return;
      runOnJS(handleDragUpdate)(event.absoluteX);
    })
    .onEnd((event) => {
      if (mode !== 'drag') return;
      runOnJS(handleRatingCompleteCallback)(event.absoluteX);
    });

  // 탭 제스처 (클릭 시에도 평점 등록)
  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (mode !== 'drag') return;
    runOnJS(handleDragUpdate)(event.absoluteX);
    runOnJS(handleRatingCompleteCallback)(event.absoluteX);
  });

  // Pan과 Tap을 Race로 결합 (둘 중 하나만 인식)
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // 별 렌더링
  const renderStar = (index: number) => {
    const starValue = index + 1;
    const currentValue = value ?? 0;

    const isFilled = starValue <= currentValue;
    const isHalf = step === 0.5 && !isFilled && starValue - 0.5 === currentValue;

    const StarIcon = isFilled ? StarFilledSvg : isHalf ? StarHalfSvg : StarBlankSvg;

    if (mode === 'tap') {
      return (
        <StarButton key={starValue} onPress={() => handleStarPress(starValue)} activeOpacity={0.7}>
          <StarIcon width={size} height={size} />
        </StarButton>
      );
    }

    // 드래그 모드에서는 TouchableOpacity 없이 렌더링
    return <StarIcon key={starValue} width={size} height={size} />;
  };

  // 드래그 모드일 때 GestureDetector로 감싸기
  if (mode === 'drag') {
    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View>
          <Container ref={containerRef} onLayout={handleLayout} gap={gap}>
            {Array.from({ length: TOTAL_STARS }, (_, index) => renderStar(index))}
          </Container>
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <Container ref={containerRef} onLayout={handleLayout} gap={gap}>
      {Array.from({ length: TOTAL_STARS }, (_, index) => renderStar(index))}
    </Container>
  );
}

/* Styled Components */

const Container = styled.View<{ gap: number }>(({ gap }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap,
}));

const StarButton = styled.TouchableOpacity({
  padding: 4,
});

export { InteractiveStarRating };
export type { InteractiveStarRatingProps };
