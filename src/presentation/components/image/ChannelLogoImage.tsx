/**
 * ChannelLogoImage - 채널 로고 원형 이미지 컴포넌트
 *
 * - 1:1 비율의 원형 이미지 (borderRadius = size / 2)
 * - 캐싱된 이미지 즉시 표시 (깜빡임 없음)
 * - source가 없거나 에러일 때 placeholder 표시
 *
 * @example
 * <ChannelLogoImage size={80} source="https://example.com/logo.jpg" />
 */

import { useState, useRef, useEffect, memo } from 'react';
import styled from '@emotion/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ImageErrorPlaceholder } from './ImageErrorPlaceholder';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import colors from '@/shared/styles/colors';

// 캐싱 판단 기준 시간 (ms)
// 이 시간 내에 로드되면 캐싱된 이미지로 판단하여 애니메이션 생략
const CACHE_THRESHOLD_MS = 50;
const FADE_DURATION_MS = 300;

// ============================================================================
// Types
// ============================================================================

export interface ChannelLogoImageProps {
  /** 이미지 크기 (너비 = 높이) */
  readonly size: number;
  /** 이미지 URL. 전달하지 않으면 placeholder를 표시합니다. */
  readonly source?: string;
}

// ============================================================================
// Component
// ============================================================================

function ChannelLogoImageComponent({ size, source }: ChannelLogoImageProps) {
  const borderRadius = size / 2;
  const hasSource = typeof source === 'string' && source.trim().length > 0;

  const [hasError, setHasError] = useState(false);
  const isLoadedRef = useRef(false);
  const shouldAnimateRef = useRef(false);
  const opacity = useSharedValue(1);

  // 50ms 후에도 로드 안 됐으면 새 이미지로 판단 → opacity 0으로 변경
  useEffect(() => {
    if (!hasSource) return;

    const timer = setTimeout(() => {
      if (!isLoadedRef.current) {
        shouldAnimateRef.current = true;
        opacity.value = 0;
      }
    }, CACHE_THRESHOLD_MS);

    return () => clearTimeout(timer);
  }, [hasSource, opacity]);

  const handleLoad = () => {
    isLoadedRef.current = true;

    if (shouldAnimateRef.current) {
      // 새 이미지: fade-in 애니메이션
      opacity.value = withTiming(1, {
        duration: FADE_DURATION_MS,
        easing: Easing.out(Easing.ease),
      });
    }
    // 캐싱된 이미지: 이미 opacity 1이므로 아무것도 안 함
  };

  const handleError = () => setHasError(true);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // source 없으면 배경색만 표시
  if (!hasSource) {
    return <OuterContainer size={size} />;
  }

  // 로드 실패 시에만 에러 플레이스홀더 표시
  if (hasError) {
    return (
      <OuterContainer size={size}>
        <ImageErrorPlaceholder width={size} height={size} borderRadius={borderRadius} />
      </OuterContainer>
    );
  }

  return (
    <OuterContainer size={size}>
      <Animated.Image
        source={{ uri: source }}
        style={[{ width: size, height: size, borderRadius }, animatedStyle]}
        onLoad={handleLoad}
        onError={handleError}
      />
    </OuterContainer>
  );
}

// ============================================================================
// ChannelLogoSkeleton (API 로딩 시 사용)
// ============================================================================

interface ChannelLogoSkeletonProps {
  size: number;
}

function ChannelLogoSkeletonComponent({ size }: ChannelLogoSkeletonProps) {
  const borderRadius = size / 2;
  return (
    <SkeletonContainer size={size}>
      <ShimmerSkeleton width={size} height={size} borderRadius={borderRadius} />
    </SkeletonContainer>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const OuterContainer = styled.View<{ size: number }>(({ size }) => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  borderWidth: 0.5,
  borderColor: colors.gray04,
  backgroundColor: colors.gray05,
  overflow: 'hidden',
}));

const SkeletonContainer = styled.View<{ size: number }>(({ size }) => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  borderWidth: 0.5,
  borderColor: colors.gray04,
  overflow: 'hidden',
}));

// ============================================================================
// Export
// ============================================================================

export const ChannelLogoImage = memo(ChannelLogoImageComponent, (prevProps, nextProps) => {
  return prevProps.source === nextProps.source && prevProps.size === nextProps.size;
});

export const ChannelLogoSkeleton = memo(ChannelLogoSkeletonComponent, (prevProps, nextProps) => {
  return prevProps.size === nextProps.size;
});
