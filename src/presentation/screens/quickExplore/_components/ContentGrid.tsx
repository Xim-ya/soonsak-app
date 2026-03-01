/**
 * ContentGrid - 무한 가상화 드래그 그리드
 *
 * 화면에 보이는 영역만 렌더링하고, 드래그 시 새로운 콘텐츠를 로드합니다.
 * 지그재그 레이아웃으로 시각적 흥미를 더합니다.
 * 랜덤 콘텐츠 포커스 기능으로 화려한 인터랙션을 제공합니다.
 *
 * @example
 * <ContentGrid
 *   ref={gridRef}
 *   onContentPress={handleContentPress}
 * />
 */

import {
  useCallback,
  useEffect,
  useRef,
  memo,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import styled from '@emotion/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AppSize } from '@/shared/utils/appSize';
import { BaseContentModel } from '@/shared/types/content/baseContentModel';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import {
  useQuickExploreGrid,
  ZIGZAG_OFFSET,
  calcZigzagOffset,
} from '../_hooks/useQuickExploreGrid';
import { ContentCard } from './ContentCard';

// EmptyCell 스타일 (MemoizedCellWrapper에서 사용)
const EmptyCell = styled.View<{ cellWidth: number; cellHeight: number }>(
  ({ cellWidth, cellHeight }) => ({
    width: cellWidth * 0.8,
    height: cellHeight * 0.9,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  }),
);

// 메모이제이션된 셀 래퍼 (정적 스타일 - 애니메이션 없음)
interface MemoizedCellWrapperProps {
  row: number;
  col: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  zigzagOffset: number;
  content: BaseContentModel | null;
  hasMoreContents: boolean;
  isFocused: boolean;
  onPress: (content: BaseContentModel) => void;
}

const MemoizedCellWrapper = memo(
  function MemoizedCellWrapper({
    row,
    col,
    cellWidth,
    cellHeight,
    columns,
    zigzagOffset,
    content,
    hasMoreContents,
    isFocused,
    onPress,
  }: MemoizedCellWrapperProps) {
    const yOffset = calcZigzagOffset(row, col, columns, zigzagOffset);

    const left = col * cellWidth;
    const top = row * cellHeight;

    // 정적 스타일 (애니메이션 없음) - 포커스 셀은 FocusedCellOverlay에서 처리
    const staticStyle = {
      position: 'absolute' as const,
      alignItems: 'center' as const,
      left,
      top,
      width: cellWidth,
      transform: [{ translateY: yOffset }],
      // 포커스된 셀은 오버레이가 위에 표시되므로 숨김
      opacity: isFocused ? 0 : 1,
    };

    const handlePress = useCallback(() => {
      if (content) {
        onPress(content);
      }
    }, [content, onPress]);

    return (
      <Animated.View style={staticStyle}>
        {content ? (
          <ContentCard content={content} onPress={handlePress} isFocused={false} />
        ) : hasMoreContents ? (
          <EmptyCell cellWidth={cellWidth} cellHeight={cellHeight} />
        ) : null}
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.cellWidth === nextProps.cellWidth &&
      prevProps.cellHeight === nextProps.cellHeight &&
      prevProps.zigzagOffset === nextProps.zigzagOffset &&
      prevProps.hasMoreContents === nextProps.hasMoreContents &&
      prevProps.isFocused === nextProps.isFocused &&
      prevProps.content?.id === nextProps.content?.id
    );
  },
);

interface ContentGridProps {
  onContentPress?: (content: BaseContentModel) => void;
  /** 콘텐츠 필터 조건 */
  filter?: ContentFilter;
}

// ContentGrid에서 외부로 노출하는 메서드
export interface ContentGridRef {
  focusOnRandomContent: () => void;
}

// 포커스된 셀 오버레이 (scale 애니메이션 - 1개만 존재)
interface FocusedCellOverlayProps {
  row: number;
  col: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  zigzagOffset: number;
  content: BaseContentModel;
  isFocused: boolean;
  onPress: (content: BaseContentModel) => void;
  onExitComplete: () => void;
}

function FocusedCellOverlay({
  row,
  col,
  cellWidth,
  cellHeight,
  columns,
  zigzagOffset,
  content,
  isFocused,
  onPress,
  onExitComplete,
}: FocusedCellOverlayProps) {
  const yOffset = calcZigzagOffset(row, col, columns, zigzagOffset);
  const left = col * cellWidth;
  const top = row * cellHeight;

  // 포커스 셀만 scale 애니메이션 적용
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      // 포커스 진입: 딜레이 후 scale up (바운싱 효과)
      scale.value = withDelay(150, withSpring(1.08, { damping: 12, stiffness: 200 }));
    } else {
      // 포커스 해제: scale down 후 완료 콜백
      scale.value = withSpring(1, { damping: 20, stiffness: 300 }, (finished) => {
        if (finished) {
          runOnJS(onExitComplete)();
        }
      });
    }
  }, [isFocused, scale, onExitComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    alignItems: 'center' as const,
    left,
    top,
    width: cellWidth,
    transform: [{ translateY: yOffset }, { scale: scale.value }],
    zIndex: 100,
  }));

  const handlePress = useCallback(() => {
    onPress(content);
  }, [content, onPress]);

  return (
    <Animated.View style={animatedStyle}>
      <ContentCard content={content} onPress={handlePress} isFocused={isFocused} />
    </Animated.View>
  );
}

// 레이아웃 상수
const DRAG_MULTIPLIER = 1.5;

// 스프링 애니메이션 설정
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 1,
};

// 포커스 애니메이션 설정
// 탐색 단계: 빠르게 스캔하는 느낌
const SCAN_STEPS = 3;
const SCAN_DURATIONS = [180, 220, 280]; // 점점 느려짐
// 착지 단계: 오버슈트가 살짝 있는 탄성 스프링
const LANDING_SPRING_CONFIG = {
  damping: 14,
  stiffness: 100,
  mass: 0.8,
};

const ContentGrid = forwardRef<ContentGridRef, ContentGridProps>(function ContentGrid(
  { onContentPress, filter },
  ref,
) {
  const {
    cells,
    isLoading,
    columns,
    hasMoreContents,
    cellWidth,
    cellHeight,
    initialTranslateX,
    initialTranslateY,
    updateViewport,
    getRandomContent,
  } = useQuickExploreGrid(filter);

  const zigzagOffset = AppSize.ratioHeight(ZIGZAG_OFFSET);

  // 드래그 위치 (useQuickExploreGrid에서 계산된 초기값 사용)
  const translateX = useSharedValue(initialTranslateX);
  const translateY = useSharedValue(initialTranslateY);

  // 드래그 시작 위치
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // 포커스 상태 (셀 위치 기반으로 매칭 - content ID보다 확실함)
  const [focusedCellKey, setFocusedCellKey] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 표시 중인 포커스 셀 (exit 애니메이션 완료까지 유지)
  const [displayedFocusedCellKey, setDisplayedFocusedCellKey] = useState<string | null>(null);

  // focusedCellKey 변경 시 displayedFocusedCellKey 업데이트
  useEffect(() => {
    if (focusedCellKey) {
      // 새 포커스: 즉시 표시
      setDisplayedFocusedCellKey(focusedCellKey);
    }
    // focusedCellKey가 null이 되면 displayedFocusedCellKey는 유지 (exit 애니메이션 후 제거)
  }, [focusedCellKey]);

  // exit 애니메이션 완료 콜백
  const handleFocusExitComplete = useCallback(() => {
    setDisplayedFocusedCellKey(null);
  }, []);

  // focusTimer 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  // 필터 변경 시 그리드 위치 리셋
  const prevFilterRef = useRef(filter);
  useEffect(() => {
    if (prevFilterRef.current !== filter) {
      prevFilterRef.current = filter;
      translateX.value = initialTranslateX;
      translateY.value = initialTranslateY;
      updateViewport(initialTranslateX, initialTranslateY);
    }
  }, [filter, initialTranslateX, initialTranslateY, translateX, translateY, updateViewport]);

  // Pan gesture worklet에서 접근할 수 있도록 shared value로 동기화
  const isFocusModeShared = useSharedValue(false);
  useEffect(() => {
    isFocusModeShared.value = isFocusMode;
  }, [isFocusMode, isFocusModeShared]);

  // 단일 딤 오버레이 애니메이션 (포커스 모드 진입/해제 시 1회만 실행)
  const overlayOpacity = useSharedValue(0);
  useEffect(() => {
    if (isFocusMode) {
      overlayOpacity.value = withTiming(0.75, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    } else {
      overlayOpacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isFocusMode, overlayOpacity]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    opacity: overlayOpacity.value,
    // 오버레이는 일반 셀(zIndex: 0) 위, 포커스 셀(zIndex: 100) 아래
    zIndex: 10,
    pointerEvents: 'none' as const,
  }));

  // 초기 뷰포트 설정
  useEffect(() => {
    updateViewport(translateX.value, translateY.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 랜덤 콘텐츠로 포커스하는 애니메이션 시퀀스
  const focusOnRandomContent = useCallback(() => {
    const target = getRandomContent();
    if (!target) {
      if (__DEV__) console.log('[ContentGrid] 포커스할 콘텐츠가 없습니다');
      return;
    }

    if (__DEV__) {
      console.log(
        `[ContentGrid] 포커스 시작: ${target.content.title} (${target.position.row}, ${target.position.col})`,
      );
    }

    // 이전 포커스 타이머 정리
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }

    // 포커스 모드 활성화
    setIsFocusMode(true);

    // 뷰포트를 먼저 목적지로 업데이트 (셀이 미리 렌더링되도록)
    updateViewport(target.translateX, target.translateY);

    // 현재 위치 저장
    const currentX = translateX.value;
    const currentY = translateY.value;
    const dx = target.translateX - currentX;
    const dy = target.translateY - currentY;

    // 스캔 경유지 생성: 타겟 방향으로 흔들리며 접근
    const scanEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
    const scanTimings = SCAN_DURATIONS.map((duration, i) => {
      const t = (i + 1) / SCAN_STEPS;
      const wobble = (1 - t) * cellWidth * 1.5;
      const angle = ((i % 2 === 0 ? 1 : -1) * Math.PI) / 4 + Math.random() * 0.5;
      return {
        x: currentX + dx * t * 0.7 + Math.cos(angle) * wobble,
        y: currentY + dy * t * 0.7 + Math.sin(angle) * wobble,
        duration,
      };
    });

    // withSequence: 스캔 경유지들 → 최종 착지
    translateX.value = withSequence(
      ...scanTimings.map((s) => withTiming(s.x, { duration: s.duration, easing: scanEasing })),
      withSpring(target.translateX, LANDING_SPRING_CONFIG),
    );
    translateY.value = withSequence(
      ...scanTimings.map((s) => withTiming(s.y, { duration: s.duration, easing: scanEasing })),
      withSpring(target.translateY, LANDING_SPRING_CONFIG),
    );

    // 총 스캔 시간
    const totalScanDuration = SCAN_DURATIONS.reduce((a, b) => a + b, 0);

    // 셀 위치 키로 포커스 (즉시 트리거)
    const cellKey = `${target.position.row}|${target.position.col}`;
    setFocusedCellKey(cellKey);

    // 빠르게 포커스 해제
    focusTimerRef.current = setTimeout(() => {
      setFocusedCellKey(null);
      setIsFocusMode(false);
      focusTimerRef.current = null;
    }, totalScanDuration + 1200);
  }, [getRandomContent, translateX, translateY, cellWidth, updateViewport]);

  // ref로 메서드 노출
  useImperativeHandle(
    ref,
    () => ({
      focusOnRandomContent,
    }),
    [focusOnRandomContent],
  );

  // 콘텐츠 클릭 핸들러
  const handleContentPress = useCallback(
    (content: BaseContentModel) => {
      onContentPress?.(content);
    },
    [onContentPress],
  );

  // 팬 제스처 (항상 활성 상태, 포커스 모드는 콜백에서 shared value로 체크)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      if (isFocusModeShared.value) return;
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (isFocusModeShared.value) return;
      translateX.value = startX.value + event.translationX * DRAG_MULTIPLIER;
      translateY.value = startY.value + event.translationY * DRAG_MULTIPLIER;
    })
    .onEnd((event) => {
      'worklet';
      if (isFocusModeShared.value) return;
      const velocityX = event.velocityX * 0.1;
      const velocityY = event.velocityY * 0.1;

      const finalX = translateX.value + velocityX;
      const finalY = translateY.value + velocityY;

      translateX.value = withSpring(finalX, SPRING_CONFIG);
      translateY.value = withSpring(finalY, SPRING_CONFIG);

      // 제스처 종료 시 뷰포트 업데이트 (UI → JS 스레드)
      runOnJS(updateViewport)(finalX, finalY);
    });

  // 그리드 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  // 로딩 중이고 셀이 없으면 로딩 표시
  if (isLoading && cells.length === 0) {
    return <LoadingContainer />;
  }

  // 표시할 포커스 셀 찾기 (exit 애니메이션 중에도 유지)
  const displayedFocusedCell = displayedFocusedCellKey
    ? cells.find((cell) => `${cell.position.row}|${cell.position.col}` === displayedFocusedCellKey)
    : null;

  return (
    <GestureDetector gesture={panGesture}>
      <Container>
        <AnimatedGrid style={animatedStyle}>
          {cells.map((cell) => {
            const cellKey = `${cell.position.row}|${cell.position.col}`;
            return (
              <MemoizedCellWrapper
                key={cellKey}
                row={cell.position.row}
                col={cell.position.col}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                columns={columns}
                zigzagOffset={zigzagOffset}
                content={cell.content}
                hasMoreContents={hasMoreContents}
                isFocused={cellKey === displayedFocusedCellKey}
                onPress={handleContentPress}
              />
            );
          })}
          {/* 포커스 모드 딤 오버레이 */}
          <Animated.View style={overlayAnimatedStyle} />
          {/* 포커스된 셀 오버레이 (scale 애니메이션 - 1개만) */}
          {displayedFocusedCell?.content && (
            <FocusedCellOverlay
              row={displayedFocusedCell.position.row}
              col={displayedFocusedCell.position.col}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              columns={columns}
              zigzagOffset={zigzagOffset}
              content={displayedFocusedCell.content}
              isFocused={focusedCellKey === displayedFocusedCellKey}
              onPress={handleContentPress}
              onExitComplete={handleFocusExitComplete}
            />
          )}
        </AnimatedGrid>
      </Container>
    </GestureDetector>
  );
});

/* Styled Components */
const Container = styled.View({
  flex: 1,
  overflow: 'visible',
});

const AnimatedGrid = styled(Animated.View)({
  position: 'relative',
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

export { ContentGrid };
export type { ContentGridProps };
