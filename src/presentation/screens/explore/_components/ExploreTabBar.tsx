/**
 * ExploreTabBar - 탐색 화면 탭 바
 *
 * react-native-collapsible-tab-view와 함께 사용되는 탭 바입니다.
 * 탭 바 아래에 필터 바도 포함하여 함께 스티키됩니다.
 *
 * useExplore 훅을 통해 필터 상태에 접근합니다.
 */

import { useCallback, useState, useLayoutEffect } from 'react';
import { ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  TabBarProps,
  useCurrentTabScrollY,
  useFocusedTab,
} from 'react-native-collapsible-tab-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { RootStackParamList } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import { analyticsService } from '@/core/services/analytics';
import type { ExploreTabName } from '@/core/services/analytics/types/events';
import { EXPLORE_SORT_TABS } from '../_types/exploreTypes';
import { useExplore } from '../_provider/ExploreProvider';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 개별 탭 버튼 Props */
interface ExploreTabButtonProps<T extends string> {
  readonly name: T;
  readonly isActive: boolean;
  readonly onTabPress: (name: T) => void;
}

/** 개별 탭 버튼 컴포넌트 */
const ExploreTabButton = <T extends string>({
  name,
  isActive,
  onTabPress,
}: ExploreTabButtonProps<T>) => {
  const tabConfig = EXPLORE_SORT_TABS.find((tab) => tab.key === name);
  const label = tabConfig?.label ?? name;
  const isDisabled = tabConfig?.isDisabled ?? false;

  return (
    <TabButton
      onPress={() => {
        if (!isDisabled) {
          onTabPress(name);
        }
      }}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <TabButtonText isActive={isActive} isDisabled={isDisabled}>
        {label}
      </TabButtonText>
      <TabIndicator isActive={isActive && !isDisabled} />
    </TabButton>
  );
};

const HORIZONTAL_PADDING = 16;

// 스타일 상수 (인라인 객체 생성 방지)
const FILTER_SCROLL_CONTENT_STYLE = { paddingHorizontal: HORIZONTAL_PADDING };
const ANDROID_GRADIENT_STYLE = Platform.OS === 'android' ? { bottom: -19 } : undefined;

/** 그라데이션 opacity가 시작되는 스크롤 오프셋 */
const GRADIENT_OPACITY_START = 240;
/** 그라데이션 opacity가 1에 도달하는 스크롤 오프셋 (스티키 시점) */
const GRADIENT_OPACITY_END = 290;

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

/** ExploreTabBar Props - collapsible-tab-view에서 전달받는 props만 포함 */
type ExploreTabBarProps<T extends string> = TabBarProps<T>;

const ExploreTabBar = <T extends string>({
  tabNames,
  indexDecimal: _indexDecimal,
  onTabPress,
}: ExploreTabBarProps<T>) => {
  void _indexDecimal; // lint 무시 (collapsible-tab-view에서 전달되지만 현재 미사용)
  const navigation = useNavigation<NavigationProp>();

  // 라이브러리에서 현재 포커스된 탭 가져오기
  const focusedTab = useFocusedTab();

  // 플리커링 방지를 위해 자체 상태 관리 (iOS/Android 공통)
  // lazy initializer로 초기값 설정
  const [activeTab, setActiveTab] = useState<T>(() => (focusedTab as T) || tabNames[0]!);

  // focusedTab 변경 시 동기화 (레이아웃 전에 실행)
  useLayoutEffect(() => {
    if (focusedTab && focusedTab !== activeTab) {
      setActiveTab(focusedTab as T);
    }
  }, [focusedTab]);

  const handleTabPress = useCallback(
    (name: T) => {
      setActiveTab(name);
      onTabPress(name);

      // explore_tab_change 이벤트 로깅
      analyticsService.exploreTabChange({
        tab_name: name as ExploreTabName,
      });
    },
    [onTabPress],
  );

  const getIsActive = (name: T) => activeTab === name;

  // Context에서 필터 상태 및 액션 가져오기
  const {
    filter,
    isCustomFilterActive,
    toggleIncludeEnding,
    toggleExcludeWatched,
    openSheet,
    gradientOpacity,
  } = useExplore();

  // 스크롤 위치 추적
  const scrollY = useCurrentTabScrollY();

  // 검색 버튼 핸들러
  const handleSearchPress = useCallback(() => {
    // explore_search_click 이벤트 로깅
    analyticsService.exploreSearchClick();
    navigation.navigate(routePages.search, { source: 'explore' });
  }, [navigation]);

  // 스크롤 위치 감지하여 그라데이션 opacity 업데이트
  useAnimatedReaction(
    () => scrollY.value,
    (offset) => {
      'worklet';
      const targetOpacity = interpolate(
        offset,
        [GRADIENT_OPACITY_START, GRADIENT_OPACITY_END],
        [0, 1],
        Extrapolation.CLAMP,
      );

      gradientOpacity.value = targetOpacity;
    },
    [scrollY, gradientOpacity],
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
            {tabNames.map((name) => (
              <ExploreTabButton
                key={name}
                name={name}
                isActive={getIsActive(name)}
                onTabPress={handleTabPress}
              />
            ))}
          </TabsWrapper>
          <SearchButton onPress={handleSearchPress} activeOpacity={0.7}>
            <SvgXml xml={searchIconSvg} width={16} height={16} />
          </SearchButton>
        </TabBarContent>
      </TabBarSection>

      {/* 필터 바 */}
      <FilterBarSection>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={FILTER_SCROLL_CONTENT_STYLE}
        >
          {/* 필터 버튼 */}
          <FilterIconButton onPress={openSheet} activeOpacity={0.7}>
            <SvgXml xml={filterIconSvg} width={16} height={16} />
            {isCustomFilterActive && <ActiveBadge />}
          </FilterIconButton>

          {/* 결말포함 칩 */}
          <FilterChip
            selected={filter.includeEnding}
            onPress={toggleIncludeEnding}
            activeOpacity={0.7}
          >
            <FilterChipText selected={filter.includeEnding}>결말포함</FilterChipText>
          </FilterChip>

          {/* 본 작품 제외 칩 */}
          <FilterChip
            selected={filter.excludeWatched}
            onPress={toggleExcludeWatched}
            activeOpacity={0.7}
          >
            <FilterChipText selected={filter.excludeWatched}>본 작품 제외</FilterChipText>
          </FilterChip>
        </ScrollView>
      </FilterBarSection>
      {/* 하단 그라데이션 - 스크롤에 따라 opacity 변화 */}
      <AnimatedGradientWrapper
        style={[gradientAnimatedStyle, ANDROID_GRADIENT_STYLE]}
        pointerEvents="none"
      >
        <BottomGradient colors={['#000000', '#00000000']} />
      </AnimatedGradientWrapper>
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

const TabButtonText = styled.Text<{ isActive: boolean; isDisabled: boolean }>(
  ({ isActive, isDisabled }) => ({
    ...textStyles.title2,
    color: isDisabled ? colors.gray04 : isActive ? colors.white : colors.gray02,
  }),
);

const TabIndicator = styled.View<{ isActive: boolean }>(({ isActive }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  backgroundColor: colors.white,
  opacity: isActive ? 1 : 0,
}));

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
