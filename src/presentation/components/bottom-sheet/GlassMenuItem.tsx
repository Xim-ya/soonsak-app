/**
 * GlassMenuItem - GlassBottomSheet 내부에서 사용하는 메뉴 아이템
 *
 * GlassBottomSheet에서 일관된 메뉴 UI를 구현하기 위한 재사용 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * <GlassBottomSheet visible={isVisible} onClose={handleClose}>
 *   <GlassMenuItem
 *     icon={<StarIcon />}
 *     label="찜하기"
 *     onPress={handleFavorite}
 *   />
 *   <GlassMenuItem
 *     icon={<ShareIcon />}
 *     label="공유하기"
 *     onPress={handleShare}
 *     showSeparator
 *   />
 * </GlassBottomSheet>
 * ```
 */

import React, { ReactNode } from 'react';
import styled from '@emotion/native';
import { Platform } from 'react-native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';

interface GlassMenuItemProps {
  /** 아이콘 (SVG, 이미지, 이모지 등) */
  readonly icon?: ReactNode;
  /** 메뉴 라벨 */
  readonly label: string;
  /** 클릭 이벤트 */
  readonly onPress?: () => void;
  /** 라벨 색상 커스터마이징 */
  readonly labelColor?: string;
  /** 비활성화 여부 */
  readonly disabled?: boolean;
  /** 하단 구분선 표시 */
  readonly showSeparator?: boolean;
  /** 오른쪽 추가 요소 (뱃지, 토글 등) */
  readonly rightElement?: ReactNode;
}

function GlassMenuItem({
  icon,
  label,
  onPress,
  labelColor = colors.white,
  disabled = false,
  showSeparator = false,
  rightElement,
}: GlassMenuItemProps) {
  return (
    <>
      <MenuItemContainer
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {icon && <IconContainer>{icon}</IconContainer>}

        <LabelText style={{ color: labelColor }}>{label}</LabelText>

        {rightElement && <RightContainer>{rightElement}</RightContainer>}
      </MenuItemContainer>

      {showSeparator && <Separator />}
    </>
  );
}

/* Styled Components */

const MenuItemContainer = styled.TouchableOpacity({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 4,
  minHeight: 56,
});

const IconContainer = styled.View({
  width: 32,
  height: 32,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 16,
});

const LabelText = styled.Text({
  ...textStyles.body1,
  flex: 1,
});

const RightContainer = styled.View({
  marginLeft: 12,
});

const Separator = styled.View({
  height: 1,
  backgroundColor: Platform.select({
    ios: 'rgba(255, 255, 255, 0.1)',
    android: colors.gray05,
  }),
  marginLeft: 48,
});

export { GlassMenuItem };
export type { GlassMenuItemProps };
