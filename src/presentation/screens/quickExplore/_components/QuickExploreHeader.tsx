/**
 * QuickExploreHeader - 빠른탐색 페이지 오버레이 UI
 *
 * - 우측 상단: 필터 버튼 (글래스모피즘)
 * - 하단 가운데: 찾기 버튼 (랜덤 탐색)
 *
 * QuickExploreProvider 내부에서 useQuickExplore() 훅을 통해 상태에 접근합니다.
 *
 * @example
 * <QuickExploreHeader />
 */

import { useCallback } from 'react';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import { analyticsService } from '@/core/services/analytics';
import { GlassIconButton } from '@/presentation/components/button/GlassIconButton';
import FilterIcon from '@assets/icons/filter.svg';
import DiceIcon from '@assets/icons/dice.svg';
import { useQuickExplore } from '../_provider/QuickExploreProvider';

const ICON_SIZE = 20;
const FILTER_BUTTON_SIZE = 44;
const DICE_BUTTON_HEIGHT = 52;

function QuickExploreHeader() {
  const insets = useSafeAreaInsets();
  const { isFilterApplied, handleFilterPress, handleSearchPress } = useQuickExplore();

  // 주사위(찾기) 버튼 클릭 핸들러 (이벤트 로깅 포함)
  const handleDicePress = useCallback(() => {
    // quick_explore_find 이벤트 로깅
    analyticsService.quickExploreFind({
      filter_applied: isFilterApplied,
    });
    handleSearchPress();
  }, [isFilterApplied, handleSearchPress]);

  return (
    <>
      {/* 우측 상단: 필터 버튼 */}
      <TopRightContainer style={{ top: insets.top }}>
        <FilterButtonWrapper>
          <GlassIconButton size={FILTER_BUTTON_SIZE} onPress={handleFilterPress}>
            <FilterIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.white} />
          </GlassIconButton>
          {isFilterApplied && <FilterIndicator />}
        </FilterButtonWrapper>
      </TopRightContainer>

      {/* 하단: 주사위 버튼 (전체 너비) */}
      <BottomContainer style={{ bottom: insets.bottom + 24 }}>
        <DiceButton activeOpacity={0.7} onPress={handleDicePress}>
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
