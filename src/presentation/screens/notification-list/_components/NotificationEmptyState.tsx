/**
 * NotificationEmptyState - 알림 빈 상태 컴포넌트
 *
 * 알림이 없을 때 표시하는 빈 상태 화면입니다.
 */

import React from 'react';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import Gap from '@/presentation/components/view/Gap';

const ICON_SIZE = 64;

// 알림 빈 상태 아이콘 SVG
const bellEmptySvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="${colors.gray04}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="${colors.gray04}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/**
 * 알림 빈 상태 컴포넌트
 * React.memo 적용 - props 없는 정적 컴포넌트로 불필요한 리렌더링 방지
 */
const NotificationEmptyState = React.memo(function NotificationEmptyState() {
  return (
    <Container>
      <SvgXml xml={bellEmptySvg} width={ICON_SIZE} height={ICON_SIZE} />
      <Gap size={20} />
      <Title>알림이 없어요</Title>
      <Gap size={8} />
      <Description>새로운 알림이 오면 여기에 표시됩니다</Description>
    </Container>
  );
});

export { NotificationEmptyState };

/* Styled Components */

const Container = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.black,
  paddingHorizontal: 32,
});

const Title = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  textAlign: 'center',
});

const Description = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  textAlign: 'center',
});
