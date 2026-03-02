/**
 * ExploreScreen - 탐색 탭 화면
 *
 * 콘텐츠를 필터링하고 정렬하여 탐색할 수 있는 화면입니다.
 * 탭 전환은 TabBar를 통해서만 가능합니다 (스와이프 비활성화).
 */

import { useRoute, RouteProp } from '@react-navigation/native';
import styled from '@emotion/native';
import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/shared/styles/colors';
import { TabParamList } from '@/shared/navigation/types';
import { ContentFilterBottomSheet } from '@/presentation/components/filter/ContentFilterBottomSheet';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { ExploreHeader } from './_components/ExploreHeader';
import { ExploreTabBar } from './_components/ExploreTabBar';
import { ExploreTabContent } from './_components/ExploreTabContent';
import { ExploreProvider, useExplore } from './_provider/ExploreProvider';

// 스타일 상수 (인라인 객체 생성 방지)
const TABS_CONTAINER_STYLE = { backgroundColor: colors.black };
const HEADER_CONTAINER_STYLE = { backgroundColor: colors.black };
const PAGER_STYLE = { backgroundColor: colors.black };
const PAGER_PROPS = {
  style: PAGER_STYLE,
  overScrollMode: 'never' as const,
  scrollEnabled: false,
};

export default function ExploreScreen() {
  const route = useRoute<RouteProp<TabParamList, 'Explore'>>();
  const initialTab = route.params?.initialTab ?? 'all';

  return (
    <ExploreProvider>
      <ExploreContent initialTab={initialTab} />
    </ExploreProvider>
  );
}

interface ExploreContentProps {
  readonly initialTab: string;
}

/**
 * ExploreContent - 실제 탐색 화면 콘텐츠
 *
 * ExploreProvider 내부에서 렌더링되어 Context에 접근 가능
 */
function ExploreContent({ initialTab }: ExploreContentProps) {
  const insets = useSafeAreaInsets();

  const {
    isVisible,
    sheetFilter,
    hasPendingFilter,
    applyFilter,
    closeSheet,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
  } = useExplore();

  return (
    <Container>
      {/* Status bar 영역을 덮는 불투명 배경 - 헤더가 스크롤될 때 이 뒤로 사라짐 */}
      <StatusBarBackground style={{ height: insets.top }} />

      <TabsContainer paddingTop={insets.top}>
        <Tabs.Container
          initialTabName={initialTab}
          renderHeader={() => <ExploreHeader />}
          renderTabBar={(props) => <ExploreTabBar {...props} />}
          containerStyle={TABS_CONTAINER_STYLE}
          headerContainerStyle={HEADER_CONTAINER_STYLE}
          minHeaderHeight={0}
          tabBarHeight={100}
          snapThreshold={null}
          allowHeaderOverscroll={true}
          pagerProps={PAGER_PROPS}
          lazy
        >
          <Tabs.Tab name="all" label="전체">
            <Tabs.Lazy>
              <ExploreTabContent sortType="all" />
            </Tabs.Lazy>
          </Tabs.Tab>
          <Tabs.Tab name="latest" label="최신">
            <Tabs.Lazy>
              <ExploreTabContent sortType="latest" />
            </Tabs.Lazy>
          </Tabs.Tab>
          <Tabs.Tab name="popular" label="인기">
            <Tabs.Lazy>
              <ExploreTabContent sortType="popular" />
            </Tabs.Lazy>
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
