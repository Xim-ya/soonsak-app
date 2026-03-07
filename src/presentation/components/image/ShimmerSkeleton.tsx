/**
 * ShimmerSkeleton - 이미지 로딩 중 표시되는 shimmer 스켈레톤
 *
 * PosterImage, BackdropImage 등에서 공통으로 사용됩니다.
 */

import { useEffect, memo } from 'react';
import styled from '@emotion/native';
import Animated from 'react-native-reanimated';
import colors from '@/presentation/styles/colors';
import { useShimmerAnimation } from './hooks/useShimmerAnimation';
import { IMAGE_DEFAULTS } from './imageConstants';

// ============================================================================
// Types
// ============================================================================

interface ShimmerSkeletonProps {
  readonly width: number;
  readonly height: number;
  readonly borderRadius?: number;
}

// ============================================================================
// Component
// ============================================================================

function ShimmerSkeletonComponent({
  width,
  height,
  borderRadius = IMAGE_DEFAULTS.borderRadius,
}: ShimmerSkeletonProps) {
  const { start, stop, shimmerStyle } = useShimmerAnimation();

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SkeletonContainer width={width} height={height} borderRadius={borderRadius}>
      <Animated.View style={[{ flex: 1 }, shimmerStyle]}>
        <SkeletonHighlight />
      </Animated.View>
    </SkeletonContainer>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

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

const SkeletonHighlight = styled.View({
  flex: 1,
  backgroundColor: colors.gray04,
});

// ============================================================================
// Export
// ============================================================================

export const ShimmerSkeleton = memo(ShimmerSkeletonComponent, (prevProps, nextProps) => {
  return (
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.borderRadius === nextProps.borderRadius
  );
});
