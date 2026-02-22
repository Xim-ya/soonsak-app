/**
 * BackdropImage - 배경 비율(16:9)을 가진 이미지 컴포넌트
 *
 * AppImage를 확장하여 배경/썸네일 전용으로 특화된 컴포넌트입니다.
 * - 배경 비율(16:9) 기본값: width만 전달하면 height 자동 계산
 * - aspectRatio props로 비율 오버라이드 가능
 * - shimmer 스켈레톤 로딩 애니메이션
 * - source가 없거나 에러일 때 logo_placeholder 표시
 *
 * @example
 * // 기본 사용 (16:9)
 * <BackdropImage width={196} source="https://image.tmdb.org/..." />
 *
 * @example
 * // 비율 오버라이드
 * <BackdropImage width={196} aspectRatio={4/3} source={url} />
 *
 * @example
 * // 캐싱 활성화
 * <BackdropImage width={196} source={url} enableCache />
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import styled from '@emotion/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { AppImage } from './AppImage';
import { ImageErrorPlaceholder } from './ImageErrorPlaceholder';
import colors from '@/shared/styles/colors';
import { IMAGE_RATIO, IMAGE_DEFAULTS } from './imageConstants';

// ============================================================================
// Types & Constants
// ============================================================================

export interface BackdropImageProps {
  /** 이미지 너비 (필수). 높이는 aspectRatio로 자동 계산됩니다. */
  readonly width: number;
  /** 이미지 URL. 전달하지 않으면 placeholder를 표시합니다. */
  readonly source?: string;
  /** 이미지 비율 (기본값: 16/9). 오버라이드 가능. */
  readonly aspectRatio?: number;
  /** 모서리 둥글기 (기본값: 4) */
  readonly borderRadius?: number;
  /** 메모리 캐시 활성화 여부 (기본값: false) */
  readonly enableCache?: boolean;
}

const SHIMMER_DURATION = 900;
const SHIMMER_MIN_OPACITY = 0.35;
const SHIMMER_MAX_OPACITY = 0.75;

// ============================================================================
// Shimmer Hook
// ============================================================================

function useShimmerAnimation() {
  const progress = useSharedValue(0);

  // progress는 stable한 sharedValue이므로 의존성 배열 비움
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const start = useCallback(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
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
    opacity: SHIMMER_MIN_OPACITY + progress.value * (SHIMMER_MAX_OPACITY - SHIMMER_MIN_OPACITY),
  }));

  return { start, stop, shimmerStyle };
}

// ============================================================================
// Sub Component: Shimmer Skeleton
// ============================================================================

interface ShimmerSkeletonProps {
  width: number;
  height: number;
  borderRadius: number;
}

function ShimmerSkeleton({ width, height, borderRadius }: ShimmerSkeletonProps) {
  const { start, stop, shimmerStyle } = useShimmerAnimation();

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return (
    <SkeletonContainer width={width} height={height} borderRadius={borderRadius}>
      <Animated.View style={[{ flex: 1 }, shimmerStyle]}>
        <SkeletonHighlight />
      </Animated.View>
    </SkeletonContainer>
  );
}

// ============================================================================
// Main Component
// ============================================================================

function BackdropImageComponent({
  width,
  source,
  aspectRatio = IMAGE_RATIO.backdrop,
  borderRadius = IMAGE_DEFAULTS.borderRadius,
  enableCache = IMAGE_DEFAULTS.enableCache,
}: BackdropImageProps) {
  const height = Math.round(width / aspectRatio);
  const hasSource = typeof source === 'string' && source.trim().length > 0;

  const [isLoading, setIsLoading] = useState(hasSource);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const showPlaceholder = !hasSource || hasError;

  return (
    <OuterContainer width={width} height={height}>
      {/* placeholder: source 없음 또는 에러 */}
      {showPlaceholder && (
        <ImageErrorPlaceholder width={width} height={height} borderRadius={borderRadius} />
      )}

      {/* shimmer: 유효한 source가 있고 이미지 로딩 중일 때 */}
      {hasSource && isLoading && !hasError && (
        <AbsoluteWrapper>
          <ShimmerSkeleton width={width} height={height} borderRadius={borderRadius} />
        </AbsoluteWrapper>
      )}

      {/* 실제 이미지 */}
      {hasSource && !hasError && (
        <AppImage
          source={source}
          width={width}
          height={height}
          borderRadius={borderRadius}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </OuterContainer>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const OuterContainer = styled.View<{ width: number; height: number }>(({ width, height }) => ({
  width,
  height,
  position: 'relative',
}));

const SkeletonContainer = styled.View<{
  width: number;
  height: number;
  borderRadius: number;
}>(({ width, height, borderRadius }) => ({
  width,
  height,
  borderRadius,
  overflow: 'hidden',
  backgroundColor: colors.gray05,
}));

const AbsoluteWrapper = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
});

const SkeletonHighlight = styled.View({
  flex: 1,
  backgroundColor: colors.gray04,
});

// ============================================================================
// BackdropSkeleton (API 로딩 시 사용)
// ============================================================================

interface BackdropSkeletonProps {
  width: number;
  aspectRatio?: number;
  borderRadius?: number;
}

function BackdropSkeletonComponent({
  width,
  aspectRatio = IMAGE_RATIO.backdrop,
  borderRadius = IMAGE_DEFAULTS.borderRadius,
}: BackdropSkeletonProps) {
  const height = Math.round(width / aspectRatio);
  return <ShimmerSkeleton width={width} height={height} borderRadius={borderRadius} />;
}

// ============================================================================
// Export
// ============================================================================

export const BackdropImage = memo(BackdropImageComponent, (prevProps, nextProps) => {
  return (
    prevProps.source === nextProps.source &&
    prevProps.width === nextProps.width &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.enableCache === nextProps.enableCache
  );
});

export const BackdropSkeleton = memo(BackdropSkeletonComponent, (prevProps, nextProps) => {
  return (
    prevProps.width === nextProps.width &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    prevProps.borderRadius === nextProps.borderRadius
  );
});
