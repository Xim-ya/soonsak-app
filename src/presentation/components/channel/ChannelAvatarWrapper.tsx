/**
 * ChannelAvatarWrapper - 채널 아바타 선택 상태 래퍼
 *
 * 채널 로고 아바타에 선택/미선택 상태를 표시합니다.
 * 선택 시 바깥에 녹색 테두리 ring을 추가로 표시합니다.
 * ChannelLogoImage의 기본 border는 그대로 유지됩니다.
 *
 * @example
 * <ChannelAvatarWrapper isSelected={true} avatarSize={72}>
 *   <ChannelLogoImage source={logoUrl} size={72} />
 * </ChannelAvatarWrapper>
 */

import React, { memo } from 'react';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';

interface ChannelAvatarWrapperProps {
  isSelected: boolean;
  avatarSize: number;
  unselectedOpacity?: number;
  children: React.ReactNode;
}

function ChannelAvatarWrapperComponent({
  isSelected,
  avatarSize,
  unselectedOpacity = 0.6,
  children,
}: ChannelAvatarWrapperProps) {
  const ringSize = avatarSize + 6;

  return (
    <Wrapper size={ringSize} style={{ opacity: isSelected ? 1 : unselectedOpacity }}>
      {children}
      {isSelected && <SelectionRing size={ringSize} />}
    </Wrapper>
  );
}

/* Styled Components */

const Wrapper = styled.View<{ size: number }>(({ size }) => ({
  width: size,
  height: size,
  justifyContent: 'center',
  alignItems: 'center',
}));

const SelectionRing = styled.View<{ size: number }>(({ size }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: size / 2,
  borderWidth: 2.5,
  borderColor: colors.green,
}));

export const ChannelAvatarWrapper = memo(ChannelAvatarWrapperComponent);
export type { ChannelAvatarWrapperProps };
