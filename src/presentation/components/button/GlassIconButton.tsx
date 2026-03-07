/**
 * GlassIconButton - 글래스모피즘 스타일의 아이콘 버튼
 *
 * 반투명 배경과 부드러운 테두리로 글래스 효과를 연출합니다.
 * 헤더나 오버레이 UI에서 아이콘 버튼으로 사용합니다.
 *
 * @example
 * <GlassIconButton onPress={handlePress}>
 *   <SearchIcon width={24} height={24} />
 * </GlassIconButton>
 *
 * @example
 * <GlassIconButton size={60} onPress={handlePress}>
 *   <NotificationIcon width={28} height={28} />
 * </GlassIconButton>
 */

import { ReactNode } from 'react';
import styled from '@emotion/native';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { AppSize } from '@/presentation/utils/appSize';

interface GlassIconButtonProps {
  children: ReactNode;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

const DEFAULT_SIZE = 56;

function GlassIconButton({
  children,
  onPress,
  size = DEFAULT_SIZE,
  style,
  disabled = false,
}: GlassIconButtonProps) {
  const responsiveSize = AppSize.ratioWidth(size);
  const borderRadius = responsiveSize / 2;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      size={responsiveSize}
      borderRadius={borderRadius}
      style={style}
    >
      {children}
    </Container>
  );
}

/* Styled Components */
const Container = styled(TouchableOpacity)<{
  size: number;
  borderRadius: number;
}>(({ size, borderRadius }) => ({
  width: size,
  height: size,
  borderRadius,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
}));

export { GlassIconButton };
export type { GlassIconButtonProps };
