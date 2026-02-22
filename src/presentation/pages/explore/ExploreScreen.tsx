/**
 * ExploreScreen - 탐색 탭 화면
 *
 * 콘텐츠를 필터링하고 정렬하여 탐색할 수 있는 화면입니다.
 * 스와이프로 탭을 전환할 수 있습니다.
 */

import { useCallback } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import colors from '@/shared/styles/colors';
import { RootStackParamList, TabParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentFilterBottomSheet } from '@/presentation/components/filter/ContentFilterBottomSheet';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import type { ExploreContentModel } from './_types/exploreTypes';
import { ExploreHeader } from './_components/ExploreHeader';
import { ExploreTabBar } from './_components/ExploreTabBar';
import { ExploreTabContent } from './_components/ExploreTabContent';
import { useExploreFilterSheet } from './_hooks/useExploreFilterSheet';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 스타일 상수 (인라인 객체 생성 방지)
const TABS_CONTAINER_STYLE = { backgroundColor: colors.black };
const HEADER_CONTAINER_STYLE = { backgroundColor: colors.black };
const PAGER_STYLE = { backgroundColor: colors.black };
const PAGER_PROPS = {
  style: PAGER_STYLE,
  overScrollMode: 'never' as const,
};

export default function ExploreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<TabParamList, 'Explore'>>();
  const insets = useSafeAreaInsets();
  const initialTab = route.params?.initialTab ?? 'all';
  const gradientOpacity = useSharedValue(0);

  const {
    filter,
    isVisible,
    sheetFilter,
    hasPendingFilter,
    isCustomFilterActive,
    toggleIncludeEnding,
    toggleExcludeWatched,
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
  } = useExploreFilterSheet();

  const handleContentPress = useCallback(
    (content: ExploreContentModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: content.id,
        title: content.title,
        type: content.type,
      });
    },
    [navigation],
  );

  return (
    <Container>
      {/* Status bar 영역을 덮는 불투명 배경 - 헤더가 스크롤될 때 이 뒤로 사라짐 */}
      <StatusBarBackground style={{ height: insets.top }} />

      <TabsContainer paddingTop={insets.top}>
        <Tabs.Container
          initialTabName={initialTab}
          renderHeader={() => <ExploreHeader />}
          renderTabBar={(props) => (
            <ExploreTabBar
              {...props}
              includeEnding={filter.includeEnding}
              onIncludeEndingToggle={toggleIncludeEnding}
              excludeWatched={filter.excludeWatched}
              onExcludeWatchedToggle={toggleExcludeWatched}
              isCustomFilterActive={isCustomFilterActive}
              onFilterPress={openSheet}
              gradientOpacity={gradientOpacity}
            />
          )}
          containerStyle={TABS_CONTAINER_STYLE}
          headerContainerStyle={HEADER_CONTAINER_STYLE}
          minHeaderHeight={0}
          tabBarHeight={100}
          snapThreshold={null}
          allowHeaderOverscroll={true}
          pagerProps={PAGER_PROPS}
        >
          <Tabs.Tab name="all" label="전체">
            <ExploreTabContent sortType="all" filter={filter} onContentPress={handleContentPress} />
          </Tabs.Tab>
          <Tabs.Tab name="latest" label="최신">
            <ExploreTabContent
              sortType="latest"
              filter={filter}
              onContentPress={handleContentPress}
            />
          </Tabs.Tab>
          <Tabs.Tab name="popular" label="인기">
            <ExploreTabContent
              sortType="popular"
              filter={filter}
              onContentPress={handleContentPress}
            />
          </Tabs.Tab>
          <Tabs.Tab name="recommended" label="개발자 추천">
            <ExploreTabContent
              sortType="recommended"
              filter={filter}
              onContentPress={handleContentPress}
            />
          </Tabs.Tab>
        </Tabs.Container>
      </TabsContainer>

      {/* 필터 바텀시트 */}
      <ContentFilterBottomSheet
        visible={isVisible}
        currentFilter={sheetFilter}
        onApply={applyFilter}
        onClose={closeSheet}
        onRequestChannelSelection={requestChannelSelection}
        preserveScrollPosition={hasPendingFilter}
      />

      {/* 로그인 유도 다이얼로그 */}
      <LoginPromptDialog
        visible={isLoginDialogVisible}
        onClose={closeLoginDialog}
        onLoginSuccess={loginSuccessCallback}
      />
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const TabsContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  flex: 1,
  backgroundColor: colors.black,
  paddingTop,
}));

const StatusBarBackground = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.black,
  zIndex: 100,
});
