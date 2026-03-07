/**
 * SkeletonView - 로딩 상태를 나타내는 스켈레톤 UI 컴포넌트
 *
 * 데이터 로딩 중에 실제 컨텐츠 대신 표시되는 placeholder 역할을 합니다.
 * 텍스트, 이미지, 버튼 등 다양한 UI 요소의 형태를 모방하여 로딩 상태를 시각적으로 표현합니다.
 *
 * @example
 * // 기본 사용법
 * <SkeletonView width={120} height={18} />
 *
 * // 원형 스켈레톤 (아바타용)
 * <SkeletonView width={64} height={64} borderRadius={32} />
 *
 * // 커스텀 색상과 패딩
 * <SkeletonView
 *   width={100}
 *   height={20}
 *   color={colors.gray04}
 *   paddingHorizontal={8}
 * />
 */

import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';

interface SkeletonViewProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  color?: string;
}

function SkeletonView({
  width,
  height,
  borderRadius = 4,
  padding,
  paddingHorizontal,
  paddingVertical,
  color = colors.gray05,
}: SkeletonViewProps) {
  const paddingStyle = {
    padding,
    paddingHorizontal,
    paddingVertical,
  };

  return (
    <Container style={paddingStyle}>
      <SkeletonBox
        {...(width !== undefined && { width })}
        {...(height !== undefined && { height })}
        borderRadius={borderRadius}
        color={color}
      />
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({});

const SkeletonBox = styled.View<{
  width?: number;
  height?: number;
  borderRadius: number;
  color: string;
}>(({ width, height, borderRadius, color }) => ({
  backgroundColor: color,
  borderRadius,
  width,
  height,
}));

export { SkeletonView };
