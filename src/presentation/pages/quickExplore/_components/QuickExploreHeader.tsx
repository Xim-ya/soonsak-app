/**
 * QuickExploreHeader - 빠른탐색 페이지 오버레이 UI
 *
 * - 우측 상단: 필터 버튼 (글래스모피즘)
 * - 하단 가운데: 찾기 버튼 (랜덤 탐색)
 *
 * @example
 * <QuickExploreHeader
 *   onFilterPress={handleFilter}
 *   onSearchPress={handleSearch}
 *   isFilterActive={isFilterActive(filter)}
 * />
 */

import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { GlassIconButton } from '@/presentation/components/button/GlassIconButton';
import FilterIcon from '@assets/icons/filter.svg';
import DiceIcon from '@assets/icons/dice.svg';

interface QuickExploreHeaderProps {
  onFilterPress?: () => void;
  onSearchPress?: () => void;
  /** 필터 활성화 여부 (인디케이터 표시) */
  isFilterActive?: boolean;
}

const ICON_SIZE = 20;
const FILTER_BUTTON_SIZE = 44;
const DICE_BUTTON_HEIGHT = 52;

function QuickExploreHeader({
  onFilterPress,
  onSearchPress,
  isFilterActive = false,
}: QuickExploreHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* 우측 상단: 필터 버튼 */}
      <TopRightContainer style={{ top: insets.top }}>
        <FilterButtonWrapper>
          <GlassIconButton
            size={FILTER_BUTTON_SIZE}
            {...(onFilterPress && { onPress: onFilterPress })}
          >
            <FilterIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.white} />
          </GlassIconButton>
          {isFilterActive && <FilterIndicator />}
        </FilterButtonWrapper>
      </TopRightContainer>

      {/* 하단: 주사위 버튼 (전체 너비) */}
      <BottomContainer>
        <DiceButton activeOpacity={0.7} {...(onSearchPress && { onPress: onSearchPress })}>
          <DiceIcon width={20} height={20} color={colors.white} />
          <DiceButtonText>찾기</DiceButtonText>
        </DiceButton>
      </BottomContainer>
    </>
  );
}

/* Styled Components */
const TopRightContainer = styled.View({
  position: 'absolute',
  right: 16,
  zIndex: 10,
});

const FilterButtonWrapper = styled.View({});

const FilterIndicator = styled.View({
  position: 'absolute',
  top: 4,
  right: 4,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.main,
});

const BottomContainer = styled.View({
  position: 'absolute',
  bottom: AppSize.bottomInset + 24,
  left: 0,
  right: 0,
  paddingHorizontal: 16,
  alignItems: 'center',
  zIndex: 10,
});

const DiceButton = styled.TouchableOpacity({
  width: '100%',
  maxWidth: AppSize.isTablet ? 400 : undefined,
  height: DICE_BUTTON_HEIGHT,
  borderRadius: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
});

const DiceButtonText = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

export { QuickExploreHeader };
export type { QuickExploreHeaderProps };
