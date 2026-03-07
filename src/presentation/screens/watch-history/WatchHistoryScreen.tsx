/**
 * WatchHistoryScreen - 시청 기록 페이지
 *
 * 시청 기록을 두 가지 뷰 모드로 표시합니다.
 * - card: 큰 썸네일 카드 스타일 (기본값: 전체 보기)
 * - list: 검색 결과 스타일 리스트 (기본값: 캘린더에서 진입 시)
 *
 * @example
 * // 전체 보기 (카드 뷰 기본)
 * navigation.navigate(routePages.watchHistory, {});
 *
 * // 특정 날짜 (리스트 뷰 기본)
 * navigation.navigate(routePages.watchHistory, { date: '2024-02-22' });
 */

import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar';
import { ShimmerSkeleton } from '@/presentation/components/image';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import type { ScreenRouteProp } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import { WatchHistoryCard, type WatchHistoryModelType } from '@/features/watch-history';
import { ViewModeToggle } from '@/presentation/components/view-mode';
import { WatchHistoryListItem } from './_components';
import { WatchHistoryProvider, useWatchHistoryContext } from './_provider';

/* Types */

type WatchHistoryScreenRouteProp = ScreenRouteProp<typeof routePages.watchHistory>;

/* Constants */

const CARD_SEPARATOR_HEIGHT = 24;
const LIST_SEPARATOR_HEIGHT = 0; // 리스트 뷰는 아이템 내부에 패딩 있음
const HORIZONTAL_PADDING = 16;
const TABLET_CARD_WIDTH = 420; // WatchHistoryCard와 동일

/* Component */

export default function WatchHistoryScreen() {
  const route = useRoute<WatchHistoryScreenRouteProp>();
  const { date } = route.params ?? {};

  return (
    <WatchHistoryProvider date={date}>
      <WatchHistoryContent />
    </WatchHistoryProvider>
  );
}

/**
 * WatchHistoryContent - 시청 기록 화면 컨텐츠
 *
 * WatchHistoryProvider 내부에서 렌더링되어 Context에 접근 가능합니다.
 */
function WatchHistoryContent() {
  const insets = useSafeAreaInsets();

  // Context에서 상태와 핸들러 가져오기
  const {
    viewMode,
    setViewMode,
    items,
    isInitialLoading,
    isFetchingNextPage,
    date,
    handleItemPress,
    handleEndReached,
  } = useWatchHistoryContext();

  // 아이템 렌더 (뷰 모드에 따라 다른 컴포넌트)
  // WatchHistoryListItem은 Context에서 handleItemPress를 가져옴
  // WatchHistoryCard는 공용 컴포넌트이므로 props로 전달
  const renderItem: ListRenderItem<WatchHistoryModelType> = useCallback(
    ({ item }) => {
      if (viewMode === 'list') {
        return <WatchHistoryListItem item={item} />;
      }
      return <WatchHistoryCard item={item} onPress={handleItemPress} />;
    },
    [viewMode, handleItemPress],
  );

  // 키 추출
  const keyExtractor = useCallback(
    (item: WatchHistoryModelType) => `${item.id}-${item.contentId}`,
    [],
  );

  // 아이템 분리자 (뷰 모드에 따라 다른 높이)
  const separatorHeight = viewMode === 'card' ? CARD_SEPARATOR_HEIGHT : LIST_SEPARATOR_HEIGHT;
  const renderItemSeparator = useCallback(
    () => (separatorHeight > 0 ? <Gap size={separatorHeight} /> : null),
    [separatorHeight],
  );

  // 스켈레톤 크기 계산
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = AppSize.isLargeScreen();
  const skeletonWidth = isLargeScreen ? TABLET_CARD_WIDTH : screenWidth - HORIZONTAL_PADDING * 2;
  const skeletonHeight = skeletonWidth * (9 / 16);

  // 로딩 더보기 인디케이터
  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterLoadingContainer>
        <ActivityIndicator color={colors.gray02} size="small" />
      </FooterLoadingContainer>
    );
  }, [isFetchingNextPage]);

  // 앱바 액션: 뷰 모드 토글
  const appBarActions = useMemo(
    () => [<ViewModeToggle key="view-toggle" mode={viewMode} onModeChange={setViewMode} />],
    [viewMode, setViewMode],
  );

  // 스켈레톤 UI 렌더링
  const renderSkeleton = () => {
    if (viewMode === 'card') {
      return (
        <SkeletonContainer isLargeScreen={isLargeScreen}>
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonItemWrapper key={index} isLargeScreen={isLargeScreen}>
              <ShimmerSkeleton width={skeletonWidth} height={skeletonHeight} borderRadius={12} />
              {index < 2 && <Gap size={CARD_SEPARATOR_HEIGHT} />}
            </SkeletonItemWrapper>
          ))}
        </SkeletonContainer>
      );
    }
    return (
      <SkeletonContainer isLargeScreen={false}>
        {Array.from({ length: 5 }).map((_, index) => (
          <ListSkeletonItem key={index}>
            <ShimmerSkeleton width={120} height={68} borderRadius={8} />
            <ListSkeletonInfo>
              <ShimmerSkeleton width={180} height={14} borderRadius={4} />
              <Gap size={6} />
              <ShimmerSkeleton width={120} height={12} borderRadius={4} />
            </ListSkeletonInfo>
          </ListSkeletonItem>
        ))}
      </SkeletonContainer>
    );
  };

  // 빈 상태 컴포넌트
  const renderEmpty = () => (
    <EmptyContainer>
      <EmptyText>시청 기록이 없어요</EmptyText>
      <EmptySubText>
        {date ? '이 날짜에 시청한 콘텐츠가 없어요' : '콘텐츠를 시청해보세요'}
      </EmptySubText>
    </EmptyContainer>
  );

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <Container style={{ paddingTop: insets.top }}>
        <BackButtonAppBar title="시청 기록" actions={appBarActions} />
        {isInitialLoading ? (
          <SkeletonScrollView
            contentContainerStyle={{
              paddingTop: viewMode === 'card' ? 16 : 8,
              paddingBottom: insets.bottom + 20,
              ...(isLargeScreen && viewMode === 'card' && { alignItems: 'center' }),
            }}
          >
            {renderSkeleton()}
          </SkeletonScrollView>
        ) : (
          <FlatList
            data={items as WatchHistoryModelType[]}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderItemSeparator}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderListFooter}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: viewMode === 'card' ? 16 : 8,
              paddingBottom: insets.bottom + 20,
              ...(isLargeScreen && viewMode === 'card' && { alignItems: 'center' }),
            }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            maxToRenderPerBatch={10}
            windowSize={7}
            initialNumToRender={10}
          />
        )}
      </Container>
    </BasePage>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const SkeletonScrollView = styled(ScrollView)({
  flex: 1,
});

/** 스켈레톤 컨테이너 - 태블릿에서 중앙 정렬 */
const SkeletonContainer = styled.View<{ isLargeScreen: boolean }>(({ isLargeScreen }) => ({
  paddingHorizontal: HORIZONTAL_PADDING,
  alignItems: isLargeScreen ? 'center' : 'flex-start',
}));

const SkeletonItemWrapper = styled.View<{ isLargeScreen: boolean }>(({ isLargeScreen }) => ({
  alignItems: isLargeScreen ? 'center' : 'flex-start',
}));

/** 리스트 뷰 스켈레톤 아이템 */
const ListSkeletonItem = styled.View({
  flexDirection: 'row',
  paddingVertical: 12,
  paddingHorizontal: HORIZONTAL_PADDING,
});

const ListSkeletonInfo = styled.View({
  marginLeft: 12,
  justifyContent: 'center',
});

const EmptyContainer = styled.View({
  paddingVertical: 60,
  alignItems: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.title2,
  color: colors.gray02,
});

const EmptySubText = styled.Text({
  ...textStyles.body3,
  color: colors.gray03,
  marginTop: 8,
});

const FooterLoadingContainer = styled.View({
  paddingVertical: 20,
  alignItems: 'center',
});
