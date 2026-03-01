import React from 'react';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import { HeaderBackground } from './HeaderBackground';
import { ContentInfo } from './ContentInfo';
import { useCurrentTabScrollY } from 'react-native-collapsible-tab-view';

/**
 * 콘텐츠 상세 페이지의 헤더 컴포넌트
 *
 * 구성:
 * - HeaderBackground: 배경 이미지, 재생 버튼, 진행률 표시
 * - ContentInfo: 콘텐츠 타입, 제목, 장르, 별점 표시
 */
export const Header = React.memo(() => {
  const scrollY = useCurrentTabScrollY();

  return (
    <Container>
      <HeaderBackground scrollY={scrollY} />
      <ContentInfo />
    </Container>
  );
});

Header.displayName = 'Header';

/* Styled Components - Header 전용 */
const Container = styled.View({
  backgroundColor: colors.black,
  pointerEvents: 'box-none' as const,
});
