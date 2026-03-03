/**
 * BaseRatioImage - 비율 기반 이미지 컴포넌트 (내부용)
 *
 * PosterImage, BackdropImage의 공통 로직을 담당합니다.
 * 외부에서는 PosterImage, BackdropImage를 사용하세요.
 *
 * - width와 aspectRatio로 height 자동 계산
 * - shimmer 스켈레톤 로딩 애니메이션
 * - source가 없거나 에러일 때 logo_placeholder 표시
 */

import { useState, memo, useRef } from 'react';
import styled from '@emotion/native';
import { AppImage } from './AppImage';
import { ImageErrorPlaceholder } from './ImageErrorPlaceholder';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import { IMAGE_DEFAULTS } from './imageConstants';

// ============================================================================
// Types
// ============================================================================

export interface BaseRatioImageProps {
  /** 이미지 너비 (필수). 높이는 aspectRatio로 자동 계산됩니다. */
  readonly width: number;
  /** 이미지 URL. 전달하지 않으면 placeholder를 표시합니다. */
  readonly source: string | undefined;
  /** 이미지 비율 (필수). PosterImage: 2/3, BackdropImage: 16/9 */
  readonly aspectRatio: number;
  /** 모서리 둥글기 (기본값: 4) */
  readonly borderRadius?: number;
  /** 메모리 캐시 활성화 여부 (기본값: false) */
  readonly enableCache?: boolean;
}

// ============================================================================
// Component
// ============================================================================

function BaseRatioImageComponent({
  width,
  source,
  aspectRatio,
  borderRadius = IMAGE_DEFAULTS.borderRadius,
  // enableCache는 현재 미사용 (향후 캐시 정책 구현 시 활용 예정)
  enableCache: _enableCache = IMAGE_DEFAULTS.enableCache,
}: BaseRatioImageProps) {
  void _enableCache; // lint 무시
  const height = Math.round(width / aspectRatio);
  const hasSource = typeof source === 'string' && source.trim().length > 0;

  const [isLoading, setIsLoading] = useState(hasSource);
  const [hasError, setHasError] = useState(false);

  // FlashList 셀 재활용 시 source 변경 감지하여 상태 리셋
  const prevSourceRef = useRef(source);
  if (prevSourceRef.current !== source) {
    prevSourceRef.current = source;
    const newHasSource = typeof source === 'string' && source.trim().length > 0;
    // 동기적으로 상태 리셋 (useEffect보다 빠름)
    if (!isLoading || hasError) {
      setIsLoading(newHasSource);
      setHasError(false);
    }
  }

  // 단순 상태 업데이트는 useCallback 불필요 (오버헤드 > 이익)
  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

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

const AbsoluteWrapper = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
});

// ============================================================================
// Export
// ============================================================================

export const BaseRatioImage = memo(BaseRatioImageComponent, (prevProps, nextProps) => {
  return (
    prevProps.source === nextProps.source &&
    prevProps.width === nextProps.width &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.enableCache === nextProps.enableCache
  );
});
