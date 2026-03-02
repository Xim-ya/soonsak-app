import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { useRoute } from '@react-navigation/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar';
import colors from '@/shared/styles/colors';
import type { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { UserContentTabBar } from './_components/UserContentTabBar';
import { MemoizedFavoritesTabView } from './_components/FavoritesTabView';
import { MemoizedRatingsTabView } from './_components/RatingsTabView';
import { MemoizedWatchedTabView } from './_components/WatchedTabView';
import { USER_CONTENT_TAB_NAMES, type UserContentTabName } from './_types';
import type { TabBarProps } from 'react-native-collapsible-tab-view';

type UserContentListRouteParams = ScreenRouteProp<typeof routePages.userContentList>;

/* 상수 정의 (인라인 객체/함수 재생성 방지) */
const TAB_BAR_HEIGHT = 48;

const headerContainerStyle = { backgroundColor: colors.black };

const pagerProps = { scrollEnabled: false };

const renderTabBar = (props: TabBarProps<string>) => <UserContentTabBar {...props} />;

/**
 * MyCollectionScreen - 사용자 콘텐츠 목록 페이지
 *
 * 찜했어요, 평가했어요, 봤어요 탭을 제공하며
 * MyPage에서 클릭한 항목에 따라 초기 탭이 결정됩니다.
 */
export default function MyCollectionScreen() {
  const route = useRoute<UserContentListRouteParams>();
  const { initialTab = 0 } = route.params ?? {};
  const insets = useSafeAreaInsets();

  // 초기 탭 인덱스를 탭 이름으로 변환
  const initialTabName = USER_CONTENT_TAB_NAMES[initialTab] as UserContentTabName;

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <AppBarContainer safeAreaTop={insets.top}>
        <BackButtonAppBar title="내 콘텐츠" />
      </AppBarContainer>

      <TabsContainer paddingTop={insets.top + TAB_BAR_HEIGHT}>
        <Tabs.Container
          initialTabName={initialTabName}
          renderTabBar={renderTabBar}
          headerContainerStyle={headerContainerStyle}
          tabBarHeight={TAB_BAR_HEIGHT}
          pagerProps={pagerProps}
        >
          <Tabs.Tab name="찜했어요">
            <MemoizedFavoritesTabView />
          </Tabs.Tab>
          <Tabs.Tab name="평가했어요">
            <MemoizedRatingsTabView />
          </Tabs.Tab>
          <Tabs.Tab name="봤어요">
            <MemoizedWatchedTabView />
          </Tabs.Tab>
        </Tabs.Container>
      </TabsContainer>
    </BasePage>
  );
}

/* Styled Components */
const AppBarContainer = styled.View<{ safeAreaTop: number }>(({ safeAreaTop }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  paddingTop: safeAreaTop,
  backgroundColor: colors.black,
}));

const TabsContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  flex: 1,
  backgroundColor: colors.black,
  paddingTop,
}));
