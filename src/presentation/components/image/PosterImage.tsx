/**
 * PosterImage - 포스터 비율(2:3)을 가진 이미지 컴포넌트
 *
 * AppImage를 확장하여 포스터 전용으로 특화된 컴포넌트입니다.
 * - 포스터 비율(2:3) 고정: width만 전달하면 height 자동 계산
 * - shimmer 스켈레톤 로딩 애니메이션 (이미지 페이드인 시 자연스럽게 가려짐)
 * - source가 없거나 에러일 때 placeholder 아이콘 표시
 *
 * @example
 * // 기본 사용
 * <PosterImage width={110} source="https://image.tmdb.org/..." />
 *
 * @example
 * // 이미지 없을 때 (placeholder 자동 표시)
 * <PosterImage width={110} />
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
import colors from '@/shared/styles/colors';
import ImagePlaceholderIcon from '@assets/icons/image_placeholder.svg';

// ============================================================================
// Types & Constants
// ============================================================================

export interface PosterImageProps {
  /** 이미지 너비 (필수). 높이는 2:3 비율로 자동 계산됩니다. */
  width: number;
  /** 이미지 URL. 전달하지 않으면 placeholder를 표시합니다. */
  source?: string;
  /** 모서리 둥글기 (기본값: 4) */
  borderRadius?: number;
}

const POSTER_ASPECT_RATIO = 2 / 3;
const DEFAULT_BORDER_RADIUS = 4;
const SHIMMER_DURATION = 900;
const SHIMMER_MIN_OPACITY = 0.35;
const SHIMMER_MAX_OPACITY = 0.75;

// ============================================================================
// Shimmer Hook
// ============================================================================

function useShimmerAnimation() {
  const progress = useSharedValue(0);

  const start = useCallback(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [progress]);

  const stop = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
  }, [progress]);

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

function PosterImageComponent({
  width,
  source,
  borderRadius = DEFAULT_BORDER_RADIUS,
}: PosterImageProps) {
  const height = Math.round(width / POSTER_ASPECT_RATIO);
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
        <PlaceholderContainer width={width} height={height} borderRadius={borderRadius}>
          <ImagePlaceholderIcon width={24} height={24} color={colors.gray03} />
        </PlaceholderContainer>
      )}

      {/* shimmer: 유효한 source가 있고 이미지 로딩 중일 때 (absolute로 겹침) */}
      {hasSource && isLoading && !hasError && (
        <AbsoluteWrapper>
          <ShimmerSkeleton width={width} height={height} borderRadius={borderRadius} />
        </AbsoluteWrapper>
      )}

      {/*
       * 실제 이미지: source가 있을 때 항상 렌더링.
       * AppImage 내부에서 이미지 로드 전 opacity=0으로 시작 후 페이드인하므로
       * shimmer 위에 자연스럽게 나타납니다.
       */}
      {hasSource && (
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

/** ShimmerSkeleton 자립형 컨테이너 (단독 사용 가능) */
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

/** PosterImage 내부에서 shimmer를 겹치기 위한 wrapper */
const AbsoluteWrapper = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
});

const SkeletonHighlight = styled.View({
  flex: 1,
  backgroundColor: colors.gray04,
});

const PlaceholderContainer = styled.View<{
  width: number;
  height: number;
  borderRadius: number;
}>(({ width, height, borderRadius }) => ({
  width,
  height,
  borderRadius,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
}));

// ============================================================================
// PosterSkeleton (API 로딩 시 사용)
// ============================================================================

interface PosterSkeletonProps {
  width: number;
  borderRadius?: number;
}

function PosterSkeletonComponent({
  width,
  borderRadius = DEFAULT_BORDER_RADIUS,
}: PosterSkeletonProps) {
  const height = Math.round(width / POSTER_ASPECT_RATIO);
  return <ShimmerSkeleton width={width} height={height} borderRadius={borderRadius} />;
}

// ============================================================================
// Export
// ============================================================================

export const PosterImage = memo(PosterImageComponent, (prevProps, nextProps) => {
  return (
    prevProps.source === nextProps.source &&
    prevProps.width === nextProps.width &&
    prevProps.borderRadius === nextProps.borderRadius
  );
});

export const PosterSkeleton = memo(PosterSkeletonComponent, (prevProps, nextProps) => {
  return prevProps.width === nextProps.width && prevProps.borderRadius === nextProps.borderRadius;
});
