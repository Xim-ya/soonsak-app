/**
 * ExploreTabBar - 탐색 화면 탭 바
 *
 * react-native-collapsible-tab-view와 함께 사용되는 탭 바입니다.
 * 탭 바 아래에 필터 바도 포함하여 함께 스티키됩니다.
 */

import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { TabBarProps, useCurrentTabScrollY } from 'react-native-collapsible-tab-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { EXPLORE_SORT_TABS } from '../_types/exploreTypes';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 개별 탭 버튼 Props */
interface ExploreTabButtonProps<T extends string> {
  readonly name: T;
  readonly index: number;
  readonly indexDecimal: SharedValue<number>;
  readonly onTabPress: (name: T) => void;
}

/** 개별 탭 버튼 컴포넌트 - Hooks 규칙 준수를 위해 분리 */
const ExploreTabButton = <T extends string>({
  name,
  index,
  indexDecimal,
  onTabPress,
}: ExploreTabButtonProps<T>) => {
  const tabConfig = EXPLORE_SORT_TABS.find((tab) => tab.key === name);
  const label = tabConfig?.label ?? name;
  const isDisabled = tabConfig?.isDisabled ?? false;

  const textStyle = useAnimatedStyle(() => {
    const isActive = Math.round(indexDecimal.value) === index;
    return {
      color: isDisabled ? colors.gray04 : isActive ? colors.white : colors.gray02,
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const isActive = Math.round(indexDecimal.value) === index;
    return {
      opacity: isActive && !isDisabled ? 1 : 0,
    };
  });

  return (
    <TabButton
      onPress={() => {
        if (!isDisabled) {
          onTabPress(name);
        }
      }}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <AnimatedTabText style={textStyle}>{label}</AnimatedTabText>
      <AnimatedIndicator style={indicatorStyle} />
    </TabButton>
  );
};

const HORIZONTAL_PADDING = 16;

/** 그라데이션 opacity가 시작되는 스크롤 오프셋 */
const GRADIENT_OPACITY_START = 240;
/** 그라데이션 opacity가 1에 도달하는 스크롤 오프셋 (스티키 시점) */
const GRADIENT_OPACITY_END = 290;

/** 개발자 추천 탭 인덱스 (필터 바 숨김 처리용) */
const RECOMMENDED_TAB_INDEX = 3;

const filterIconSvg = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const searchIconSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface ExploreTabBarProps<T extends string> extends TabBarProps<T> {
  /** 결말 포함 필터 활성화 여부 */
  readonly includeEnding: boolean;
  /** 결말 포함 필터 토글 콜백 */
  readonly onIncludeEndingToggle: () => void;
  /** 본 작품 제외 필터 활성화 여부 */
  readonly excludeWatched: boolean;
  /** 본 작품 제외 필터 토글 콜백 (로그인 체크 포함) */
  readonly onExcludeWatchedToggle: () => void;
  /** 커스텀 필터 적용 여부 */
  readonly isCustomFilterActive: boolean;
  /** 필터 버튼 클릭 콜백 */
  readonly onFilterPress: () => void;
  /** 하단 그라데이션 opacity를 제어하는 SharedValue */
  readonly gradientOpacity: SharedValue<number>;
}

const ExploreTabBar = <T extends string>({
  tabNames,
  indexDecimal,
  onTabPress,
  includeEnding,
  onIncludeEndingToggle,
  excludeWatched,
  onExcludeWatchedToggle,
  isCustomFilterActive,
  onFilterPress,
  gradientOpacity,
}: ExploreTabBarProps<T>) => {
  const navigation = useNavigation<NavigationProp>();

  // 개발자 추천 탭(index 3)일 때 필터 바 숨김
  const [showFilterBar, setShowFilterBar] = React.useState(true);

  // 스크롤 위치 추적
  const scrollY = useCurrentTabScrollY();

  // 검색 버튼 핸들러
  const handleSearchPress = useCallback(() => {
    navigation.navigate(routePages.search);
  }, [navigation]);

  // 탭 인덱스 변화 감지하여 필터 바 표시 여부 업데이트
  // 값이 실제로 변경되었을 때만 runOnJS 호출
  useAnimatedReaction(
    () => Math.round(indexDecimal.value),
    (currentIndex, previousIndex) => {
      'worklet';
      if (currentIndex !== previousIndex) {
        runOnJS(setShowFilterBar)(currentIndex !== RECOMMENDED_TAB_INDEX);
      }
    },
    [indexDecimal],
  );

  // 디버그용 로그
  const logScrollPosition = React.useCallback((offset: number) => {
    console.log(`[ExploreTabBar] Y: ${Math.round(offset)}`);
  }, []);

  // 스크롤 위치 감지하여 그라데이션 opacity 업데이트
  // interpolate 사용으로 간결화 + 불필요한 업데이트 방지
  useAnimatedReaction(
    () => scrollY.value,
    (offset) => {
      'worklet';
      // 디버그 로그 (10px 단위로만 출력)
      if (Math.round(offset) % 10 === 0) {
        runOnJS(logScrollPosition)(offset);
      }

      const targetOpacity = interpolate(
        offset,
        [GRADIENT_OPACITY_START, GRADIENT_OPACITY_END],
        [0, 1],
        Extrapolation.CLAMP,
      );

      // 값이 변경된 경우에만 업데이트 (소수점 3자리까지 비교)
      const roundedTarget = Math.round(targetOpacity * 1000) / 1000;
      const roundedCurrent = Math.round(gradientOpacity.value * 1000) / 1000;

      if (roundedTarget !== roundedCurrent) {
        gradientOpacity.value = targetOpacity;
      }
    },
    [scrollY, gradientOpacity, logScrollPosition],
  );

  // 그라데이션 애니메이션 스타일
  const gradientAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: gradientOpacity.value,
    };
  }, [gradientOpacity]);

  return (
    <Container>
      {/* 탭 바 */}
      <TabBarSection>
        <TabBarContent>
          <TabsWrapper>
            {tabNames.map((name, index) => (
              <ExploreTabButton
                key={name}
                name={name}
                index={index}
                indexDecimal={indexDecimal}
                onTabPress={onTabPress}
              />
            ))}
          </TabsWrapper>
          <SearchButton onPress={handleSearchPress} activeOpacity={0.7}>
            <SvgXml xml={searchIconSvg} width={16} height={16} />
          </SearchButton>
        </TabBarContent>
      </TabBarSection>

      {/* 필터 바 (개발자 추천 탭이 아닐 때만 표시) */}
      {showFilterBar && (
        <FilterBarSection>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
          >
            {/* 필터 버튼 */}
            <FilterIconButton onPress={onFilterPress} activeOpacity={0.7}>
              <SvgXml xml={filterIconSvg} width={16} height={16} />
              {isCustomFilterActive && <ActiveBadge />}
            </FilterIconButton>

            {/* 결말포함 칩 */}
            <FilterChip
              selected={includeEnding}
              onPress={onIncludeEndingToggle}
              activeOpacity={0.7}
            >
              <FilterChipText selected={includeEnding}>결말포함</FilterChipText>
            </FilterChip>

            {/* 본 작품 제외 칩 */}
            <FilterChip
              selected={excludeWatched}
              onPress={onExcludeWatchedToggle}
              activeOpacity={0.7}
            >
              <FilterChipText selected={excludeWatched}>본 작품 제외</FilterChipText>
            </FilterChip>
          </ScrollView>
        </FilterBarSection>
      )}
      {/* 하단 그라데이션 - 스크롤에 따라 opacity 변화 */}
      {showFilterBar && (
        <AnimatedGradientWrapper
          style={[
            gradientAnimatedStyle,
            // Android: LinearGradient 렌더링 아티팩트 방지를 위해 1px 위로 이동
            Platform.OS === 'android' && { bottom: -19 },
          ]}
          pointerEvents="none"
        >
          <BottomGradient colors={['#000000', '#00000000']} />
        </AnimatedGradientWrapper>
      )}
    </Container>
  );
};

const Container = styled.View({
  backgroundColor: colors.black,
  zIndex: 10,
  overflow: 'visible',
});

const TabBarSection = styled.View({
  height: 44,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

const TabBarContent = styled.View({
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: HORIZONTAL_PADDING,
});

const TabsWrapper = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const SearchButton = styled(TouchableOpacity)({
  padding: 8,
});

const TabButton = styled.TouchableOpacity({
  marginRight: 24,
  height: 43,
  justifyContent: 'center',
});

const AnimatedTabText = styled(Animated.Text)({
  ...textStyles.title2,
});

const AnimatedIndicator = styled(Animated.View)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  backgroundColor: colors.white,
});

const FilterBarSection = styled.View({
  paddingTop: 10,
  paddingBottom: 10,
});

const AnimatedGradientWrapper = styled(Animated.View)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: -20,
  height: 20,
});

const BottomGradient = styled(LinearGradient)({
  flex: 1,
});

const FilterIconButton = styled.TouchableOpacity({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
  position: 'relative',
});

const ActiveBadge = styled.View({
  position: 'absolute',
  top: 2,
  right: 2,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.main,
});

const FilterChip = styled.TouchableOpacity<{ selected: boolean; disabled?: boolean }>(
  ({ selected, disabled }) => ({
    height: 36,
    backgroundColor: selected ? colors.white : colors.gray05,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: selected ? 0 : 1,
    borderColor: colors.gray04,
    marginRight: 10,
    opacity: disabled ? 0.4 : 1,
    justifyContent: 'center',
    alignItems: 'center',
  }),
);

const FilterChipText = styled.Text<{ selected: boolean; disabled?: boolean }>(({ selected }) => ({
  ...textStyles.alert1,
  color: selected ? colors.black : colors.gray01,
}));

export { ExploreTabBar };
