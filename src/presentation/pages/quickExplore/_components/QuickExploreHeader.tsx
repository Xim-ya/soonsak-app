/**
 * QuickExploreHeader - 빠른탐색 페이지 상단 헤더
 *
 * 글래스모피즘 스타일의 필터/검색 버튼이 포함된 헤더입니다.
 * 콘텐츠 그리드 위에 오버레이로 표시됩니다.
 * 필터가 활성화되면 필터 버튼에 인디케이터가 표시됩니다.
 *
 * @example
 * <QuickExploreHeader
 *   onFilterPress={handleFilter}
 *   onSearchPress={handleSearch}
 *   isFilterActive={isFilterActive(filter)}
 * />
 */

import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { GlassIconButton } from '@/presentation/components/button/GlassIconButton';
import SearchIcon from '@assets/icons/search_tab.svg';

interface QuickExploreHeaderProps {
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  /** 필터 활성화 여부 (인디케이터 표시) */
  isFilterActive?: boolean;
}

const HEADER_PADDING = 20;
const ICON_SIZE = 24;
const BUTTON_SIZE = 56;

function QuickExploreHeader({
  onFilterPress,
  onSearchPress,
  isFilterActive = false,
}: QuickExploreHeaderProps) {
  return (
    <Container>
      {/* 좌측: 필터 버튼 */}
      <FilterButtonWrapper>
        <GlassIconButton size={BUTTON_SIZE} {...(onFilterPress && { onPress: onFilterPress })}>
          <FilterButtonText>필터</FilterButtonText>
        </GlassIconButton>
        {isFilterActive && <FilterIndicator />}
      </FilterButtonWrapper>

      {/* 우측: 검색 버튼 */}
      <GlassIconButton size={BUTTON_SIZE} {...(onSearchPress && { onPress: onSearchPress })}>
        <SearchIcon width={ICON_SIZE} height={ICON_SIZE} fill={colors.white} />
      </GlassIconButton>
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  position: 'absolute',
  bottom: AppSize.bottomInset + AppSize.ratioHeight(HEADER_PADDING),
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: AppSize.ratioWidth(HEADER_PADDING),
  zIndex: 10,
});

const FilterButtonWrapper = styled.View({});

const FilterButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

const FilterIndicator = styled.View({
  position: 'absolute',
  top: 6,
  right: 6,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.main,
});

export { QuickExploreHeader };
export type { QuickExploreHeaderProps };
