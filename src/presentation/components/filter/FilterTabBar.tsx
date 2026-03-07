/**
 * FilterTabBar - 필터 상단 수평 스크롤 탭 바
 *
 * 장르, 국가, 공개연도, 평점 등 필터 카테고리를 수평 탭으로 표시합니다.
 * 선택된 탭에 밑줄 인디케이터가 표시됩니다.
 *
 * @example
 * <FilterTabBar
 *   tabs={FILTER_TABS}
 *   activeTab="genre"
 *   onTabPress={(key) => setActiveTab(key)}
 * />
 */

import React, { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import styled from '@emotion/native';
import textStyles from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';
import type { FilterTabConfig, FilterTabKey } from '@/core/types/filter/contentFilter';

interface FilterTabBarProps {
  /** 탭 목록 */
  readonly tabs: readonly FilterTabConfig[];
  /** 현재 활성 탭 키 */
  readonly activeTab: FilterTabKey;
  /** 탭 선택 콜백 */
  readonly onTabPress: (key: FilterTabKey) => void;
}

function FilterTabBar({ tabs, activeTab, onTabPress }: FilterTabBarProps): React.ReactElement {
  const scrollRef = useRef<ScrollView>(null);

  const handleTabPress = useCallback(
    (key: FilterTabKey) => {
      onTabPress(key);
    },
    [onTabPress],
  );

  return (
    <TabScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={TAB_CONTENT_CONTAINER_STYLE}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TabItem key={tab.key} onPress={() => handleTabPress(tab.key)} activeOpacity={0.7}>
            <TabLabel isActive={isActive}>{tab.label}</TabLabel>
            {isActive && <TabIndicator />}
          </TabItem>
        );
      })}
    </TabScrollView>
  );
}

const TAB_CONTENT_CONTAINER_STYLE = { paddingHorizontal: 20, gap: 24 } as const;

/* Styled Components */

const TabScrollView = styled.ScrollView({
  flexShrink: 0,
  flexGrow: 0,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray04,
});

const TabItem = styled.TouchableOpacity({
  paddingVertical: 12,
  alignItems: 'center',
});

const TabLabel = styled.Text<{ isActive: boolean }>(({ isActive }) => ({
  ...(isActive ? textStyles.title2 : textStyles.body2),
  color: isActive ? colors.white : colors.gray02,
}));

const TabIndicator = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  backgroundColor: colors.white,
  borderRadius: 1,
});

export { FilterTabBar };
export type { FilterTabBarProps };
