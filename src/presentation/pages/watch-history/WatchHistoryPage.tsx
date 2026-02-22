/**
 * WatchHistoryPage - 시청 기록 페이지
 *
 * 시청 기록을 ChannelPage 스타일의 세로 리스트로 표시합니다.
 * - date 파라미터 없음: 전체 시청 기록
 * - date 파라미터 있음: 해당 날짜의 시청 기록만
 *
 * @example
 * // 전체 보기
 * navigation.navigate(routePages.watchHistory, {});
 *
 * // 특정 날짜
 * navigation.navigate(routePages.watchHistory, { date: '2024-02-22' });
 */

import { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItem, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { ScreenRouteProp, RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import {
  WatchHistoryCard,
  useWatchHistoryByDate,
  useInfiniteUniqueWatchHistory,
  type WatchHistoryModelType,
} from '@/features/watch-history';

/* Types */

type WatchHistoryPageRouteProp = ScreenRouteProp<typeof routePages.watchHistory>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/* Constants */

const ITEM_SEPARATOR_HEIGHT = 24;

/* Component */

export default function WatchHistoryPage() {
  const route = useRoute<WatchHistoryPageRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const { date } = route.params ?? {};

  // 날짜 여부에 따라 다른 Hook 사용
  const byDateQuery = useWatchHistoryByDate(date ?? '', { enabled: !!date });
  const infiniteQuery = useInfiniteUniqueWatchHistory(20, { enabled: !date });

  // 데이터 통합
  const { items, isLoading, isFetchingNextPage, hasNextPage } = useMemo(() => {
    if (date) {
      return {
        items: byDateQuery.data ?? [],
        isLoading: byDateQuery.isLoading,
        isFetchingNextPage: false,
        hasNextPage: false,
      };
    }
    // 무한 스크롤 데이터 평탄화
    const allItems = infiniteQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return {
      items: allItems,
      isLoading: infiniteQuery.isLoading,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
      hasNextPage: infiniteQuery.hasNextPage ?? false,
    };
  }, [date, byDateQuery.data, byDateQuery.isLoading, infiniteQuery.data, infiniteQuery.isLoading, infiniteQuery.isFetchingNextPage, infiniteQuery.hasNextPage]);

  // 다음 페이지 로드
  const handleEndReached = useCallback(() => {
    if (!date && hasNextPage && !isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [date, hasNextPage, isFetchingNextPage, infiniteQuery]);

  const appBarTitle = '시청 기록';

  // 아이템 클릭 핸들러 (이어보기: 플레이어로 직접 이동)
  // videoId가 없는 경우 콘텐츠 상세 페이지로 fallback
  const handleItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      if (!item.videoId) {
        navigation.navigate(routePages.contentDetail, {
          id: item.contentId,
          type: item.contentType,
        });
        return;
      }
      navigation.navigate(routePages.player, {
        videoId: item.videoId,
        title: item.contentTitle,
        contentId: item.contentId,
        contentType: item.contentType,
        ...(item.progressSeconds > 0 && { startSeconds: item.progressSeconds }),
      });
    },
    [navigation],
  );

  // 아이템 렌더
  const renderItem: ListRenderItem<WatchHistoryModelType> = useCallback(
    ({ item }) => <WatchHistoryCard item={item} onPress={handleItemPress} />,
    [handleItemPress],
  );

  // 키 추출
  const keyExtractor = useCallback(
    (item: WatchHistoryModelType) => `${item.id}-${item.contentId}`,
    [],
  );

  // 아이템 분리자
  const renderItemSeparator = useCallback(() => <Gap size={ITEM_SEPARATOR_HEIGHT} />, []);

  // 빈 상태
  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <ActivityIndicator color={colors.gray02} />
        </LoadingContainer>
      );
    }
    return (
      <EmptyContainer>
        <EmptyText>시청 기록이 없어요</EmptyText>
        <EmptySubText>
          {date ? '이 날짜에 시청한 콘텐츠가 없어요' : '콘텐츠를 시청해보세요'}
        </EmptySubText>
      </EmptyContainer>
    );
  }, [isLoading, date]);

  // 로딩 더보기 인디케이터
  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterLoadingContainer>
        <ActivityIndicator color={colors.gray02} size="small" />
      </FooterLoadingContainer>
    );
  }, [isFetchingNextPage]);

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <Container style={{ paddingTop: insets.top }}>
        <BackButtonAppBar title={appBarTitle} />
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={renderItemSeparator}
          ListEmptyComponent={renderListEmpty}
          ListFooterComponent={renderListFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: insets.bottom + 20,
          }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          maxToRenderPerBatch={10}
          windowSize={7}
          initialNumToRender={10}
        />
      </Container>
    </BasePage>
  );
}

/* Styled Components */

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const LoadingContainer = styled.View({
  paddingVertical: 60,
  alignItems: 'center',
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
