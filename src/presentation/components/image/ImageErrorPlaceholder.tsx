/**
 * ImageErrorPlaceholder - 이미지 로드 실패 시 표시되는 공통 플레이스홀더
 *
 * 모든 이미지 컴포넌트(PosterImage, BackdropImage, AppImage)에서
 * 에러 발생 시 일관된 UI를 제공합니다.
 *
 * @example
 * <ImageErrorPlaceholder width={110} height={165} />
 */

import { memo } from 'react';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import LogoPlaceholderIcon from '@assets/icons/logo_placeholder.svg';
import { ERROR_PLACEHOLDER, IMAGE_DEFAULTS } from './imageConstants';

// ============================================================================
// Types
// ============================================================================

interface ImageErrorPlaceholderProps {
  /** 컨테이너 너비 */
  readonly width: number;
  /** 컨테이너 높이 */
  readonly height: number;
  /** 테두리 둥글기 (기본값: 4) */
  readonly borderRadius?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 컨테이너 크기에 맞는 아이콘 사이즈 계산
 */
function calculateIconSize(width: number, height: number): number {
  const smallerDimension = Math.min(width, height);
  const calculatedSize = smallerDimension * ERROR_PLACEHOLDER.iconSizeRatio;

  return Math.max(
    ERROR_PLACEHOLDER.minIconSize,
    Math.min(calculatedSize, ERROR_PLACEHOLDER.maxIconSize),
  );
}

// ============================================================================
// Component
// ============================================================================

function ImageErrorPlaceholderComponent({
  width,
  height,
  borderRadius = IMAGE_DEFAULTS.borderRadius,
}: ImageErrorPlaceholderProps) {
  // 단순 계산은 useMemo 불필요 (오버헤드 > 이익)
  const iconSize = calculateIconSize(width, height);
  const iconHeight = iconSize * 0.67; // logo_placeholder.svg 비율 (200:134)

  return (
    <Container width={width} height={height} borderRadius={borderRadius}>
      <LogoPlaceholderIcon width={iconSize} height={iconHeight} color={colors.gray03} />
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.View<{
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
// Export
// ============================================================================

export const ImageErrorPlaceholder = memo(
  ImageErrorPlaceholderComponent,
  (prevProps, nextProps) =>
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.borderRadius === nextProps.borderRadius,
);
