import React from 'react';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import Gap from '@/presentation/components/view/Gap';

const ICON_SIZE = 48;

// 검색 아이콘 SVG (초기 상태용)
const searchIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 결과 없음 아이콘 SVG
const noResultsIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 에러 아이콘 SVG
const errorIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface EmptyStateConfig {
  icon: string;
  title: string;
  description: string;
}

type EmptyStateType = 'initial' | 'noResults' | 'error';

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  initial: {
    icon: searchIconSvg,
    title: '콘텐츠 검색',
    description: '영화, 시리즈를 검색해보세요',
  },
  noResults: {
    icon: noResultsIconSvg,
    title: '검색 결과가 없습니다',
    description: '등록된 콘텐츠 중 일치하는 결과가 없습니다',
  },
  error: {
    icon: errorIconSvg,
    title: '검색 중 오류가 발생했습니다',
    description: '잠시 후 다시 시도해주세요',
  },
};

interface SearchEmptyStateProps {
  type: EmptyStateType;
}

/**
 * SearchEmptyState - 검색 빈 상태 컴포넌트
 *
 * 초기 상태(검색어 없음) 또는 결과 없음 상태를 표시합니다.
 */
function SearchEmptyState({ type }: SearchEmptyStateProps) {
  const config = emptyStateConfigs[type];

  return (
    <Container>
      <SvgXml xml={config.icon} width={ICON_SIZE} height={ICON_SIZE} />
      <Gap size={16} />
      <Title>{config.title}</Title>
      <Gap size={8} />
      <Description>{config.description}</Description>
    </Container>
  );
}

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

export { SearchEmptyState };
