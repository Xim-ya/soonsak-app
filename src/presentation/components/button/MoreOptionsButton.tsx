/**
 * MoreOptionsButton - 더보기 버튼 컴포넌트
 *
 * 콘텐츠 상세 페이지 앱바에서 추가 옵션을 표시하는 버튼입니다.
 * "..." 아이콘을 표시합니다.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';

// 상수 정의
const ICON_SIZE = 24;
const BUTTON_SIZE = 24;

// 더보기 아이콘 SVG (가로 점 3개)
const moreHorizontalSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="5" cy="12" r="1.5" fill="ICON_COLOR"/>
<circle cx="12" cy="12" r="1.5" fill="ICON_COLOR"/>
<circle cx="19" cy="12" r="1.5" fill="ICON_COLOR"/>
</svg>
`;

interface MoreOptionsButtonProps {
  /** 버튼 클릭 시 호출되는 콜백 */
  onPress: () => void;
  /** 아이콘 색상 */
  iconColor?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}

const MoreOptionsButton = React.memo<MoreOptionsButtonProps>(
  ({ onPress, iconColor = colors.gray01, disabled = false }) => {
    const svgIcon = moreHorizontalSvg.replace(/ICON_COLOR/g, iconColor);

    return (
      <Container
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="더보기"
        accessibilityRole="button"
      >
        <SvgXml xml={svgIcon} width={ICON_SIZE} height={ICON_SIZE} />
      </Container>
    );
  },
);

/* Styled Components */
const Container = styled(TouchableOpacity)({
  width: BUTTON_SIZE,
  height: BUTTON_SIZE,
  justifyContent: 'center',
  alignItems: 'center',
});

MoreOptionsButton.displayName = 'MoreOptionsButton';

export { MoreOptionsButton };
export type { MoreOptionsButtonProps };
