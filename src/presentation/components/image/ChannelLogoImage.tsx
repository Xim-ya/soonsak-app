/**
 * ChannelLogoImage - 채널 로고 원형 이미지 컴포넌트
 *
 * - 1:1 비율의 원형 이미지 (borderRadius = size / 2)
 * - AppImage 기반으로 메모리/디스크 캐싱 지원
 * - shimmer 스켈레톤 로딩 애니메이션
 * - source가 없거나 에러일 때 placeholder 표시
 *
 * @example
 * // 기본 사용
 * <ChannelLogoImage size={80} source="https://example.com/logo.jpg" />
 *
 * @example
 * // 캐싱 비활성화
 * <ChannelLogoImage size={80} source={url} enableCache={false} />
 */

import { useState, memo } from 'react';
import styled from '@emotion/native';
import { AppImage, CachePolicy } from './AppImage';
import { ImageErrorPlaceholder } from './ImageErrorPlaceholder';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import colors from '@/shared/styles/colors';

// ============================================================================
// Types
// ============================================================================

export interface ChannelLogoImageProps {
  /** 이미지 크기 (너비 = 높이) */
  readonly size: number;
  /** 이미지 URL. 전달하지 않으면 placeholder를 표시합니다. */
  readonly source?: string;
  /** 캐싱 활성화 여부 (기본값: true) */
  readonly enableCache?: boolean;
}

// ============================================================================
// Component
// ============================================================================

function ChannelLogoImageComponent({ size, source, enableCache = true }: ChannelLogoImageProps) {
  const borderRadius = size / 2;
  const hasSource = typeof source === 'string' && source.trim().length > 0;

  const [isLoading, setIsLoading] = useState(hasSource);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const showPlaceholder = !hasSource || hasError;

  return (
    <OuterContainer size={size}>
      {/* placeholder: source 없음 또는 에러 */}
      {showPlaceholder && (
        <ImageErrorPlaceholder width={size} height={size} borderRadius={borderRadius} />
      )}

      {/* shimmer: 유효한 source가 있고 이미지 로딩 중일 때 */}
      {hasSource && isLoading && !hasError && (
        <AbsoluteWrapper>
          <ShimmerSkeleton width={size} height={size} borderRadius={borderRadius} />
        </AbsoluteWrapper>
      )}

      {/* 실제 이미지 */}
      {hasSource && !hasError && (
        <AppImage
          source={source}
          width={size}
          height={size}
          borderRadius={borderRadius}
          cachePolicy={enableCache ? CachePolicy.MemoryDisk : CachePolicy.None}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
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
  position: 'relative',
  borderRadius: size / 2,
  borderWidth: 0.5,
  borderColor: colors.gray04,
  overflow: 'hidden',
}));

const AbsoluteWrapper = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
});

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
  return (
    prevProps.source === nextProps.source &&
    prevProps.size === nextProps.size &&
    prevProps.enableCache === nextProps.enableCache
  );
});

export const ChannelLogoSkeleton = memo(ChannelLogoSkeletonComponent, (prevProps, nextProps) => {
  return prevProps.size === nextProps.size;
});
