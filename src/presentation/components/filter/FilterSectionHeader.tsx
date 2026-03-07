/**
 * FilterSectionHeader - 필터 섹션 헤더 컴포넌트
 *
 * "장르", "국가" 등 섹션 제목을 표시합니다.
 *
 * @example
 * <FilterSectionHeader title="장르" />
 */

import React from 'react';
import styled from '@emotion/native';
import textStyles from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

interface FilterSectionHeaderProps {
  /** 섹션 제목 */
  readonly title: string;
  /** 제목 옆 보조 텍스트 */
  readonly subtitle?: string;
  /** 더보기 버튼 콜백 (제공 시 우측에 "더보기 >" 표시) */
  readonly onMorePress?: () => void;
}

function FilterSectionHeader({
  title,
  subtitle,
  onMorePress,
}: FilterSectionHeaderProps): React.ReactElement {
  return (
    <Container>
      <TitleRow>
        <TitleGroup>
          <SectionTitle>{title}</SectionTitle>
          {subtitle && <SubtitleText>{subtitle}</SubtitleText>}
        </TitleGroup>
        {onMorePress && (
          <MoreButton onPress={onMorePress} activeOpacity={0.7}>
            <MoreText>더보기</MoreText>
            <RightArrowIcon width={12} height={12} />
          </MoreButton>
        )}
      </TitleRow>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  paddingHorizontal: 20,
  paddingTop: 24,
  paddingBottom: 12,
});

const TitleRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const TitleGroup = styled.View({
  flexDirection: 'row',
  alignItems: 'baseline',
  gap: 6,
});

const SectionTitle = styled.Text({
  ...textStyles.title1,
  color: colors.gray02,
});

const SubtitleText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

const MoreButton = styled.TouchableOpacity({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
});

const MoreText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

export { FilterSectionHeader };
export type { FilterSectionHeaderProps };
