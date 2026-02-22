/**
 * BackdropImage - 배경 비율(16:9)을 가진 이미지 컴포넌트
 *
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
 */

import { memo } from 'react';
import { BaseRatioImage } from './BaseRatioImage';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import { IMAGE_RATIO, IMAGE_DEFAULTS } from './imageConstants';

// ============================================================================
// Types
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

// ============================================================================
// Component
// ============================================================================

function BackdropImageComponent({
  width,
  source,
  aspectRatio = IMAGE_RATIO.backdrop,
  borderRadius = IMAGE_DEFAULTS.borderRadius,
  enableCache = IMAGE_DEFAULTS.enableCache,
}: BackdropImageProps) {
  return (
    <BaseRatioImage
      width={width}
      source={source}
      aspectRatio={aspectRatio}
      borderRadius={borderRadius}
      enableCache={enableCache}
    />
  );
}

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
