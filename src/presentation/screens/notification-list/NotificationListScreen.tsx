/**
 * NotificationListScreen - 알림 목록 화면
 *
 * 사용자의 푸시 알림 내역을 표시합니다.
 * - 읽음/안읽음 상태 구분
 * - 무한 스크롤 페이지네이션
 * - Pull to refresh
 * - 알림 클릭 시 딥링크 이동
 *
 * 최적화 적용:
 * - 규칙 5.2: React.memo된 컴포넌트에 전달하는 함수만 useCallback 적용
 * - 규칙 6.1: FlatList 성능 최적화 옵션 추가
 */

import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, ActivityIndicator, ListRenderItem } from 'react-native';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import colors from '@/shared/styles/colors';
import type { NotificationItem } from '@/features/notifications';
import { useNotificationList } from './_hooks/useNotificationList';
import {
  NotificationListHeader,
  NotificationItemView,
  NotificationEmptyState,
} from './_components';

const ITEM_HEIGHT_ESTIMATE = 100;

export default function NotificationListScreen() {
  const {
    items,
    isLoading,
    isEmpty,
    isRefetching,
    isFetchingNextPage,
    handleNotificationPress,
    handleGoBack,
    handleMarkAllAsRead,
    handleRefresh,
    handleLoadMore,
  } = useNotificationList();

  // 읽지 않은 알림이 있는지 확인
  const hasUnread = useMemo(() => items.some((item) => !item.readAt), [items]);

  // 아이템 렌더링
  const renderItem: ListRenderItem<NotificationItem> = useCallback(
    ({ item }) => <NotificationItemView item={item} onPress={handleNotificationPress} />,
    [handleNotificationPress],
  );

  // 아이템 키 추출
  const keyExtractor = useCallback((item: NotificationItem) => item.id, []);

  // 아이템 분리자
  const ItemSeparator = useCallback(() => <Separator />, []);

  // 푸터 로딩 인디케이터
  const ListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterContainer>
        <ActivityIndicator size="small" color={colors.gray03} />
      </FooterContainer>
    );
  }, [isFetchingNextPage]);

  // 빈 상태 또는 초기 로딩
  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <ActivityIndicator color={colors.gray02} />
        </LoadingContainer>
      );
    }
    return <NotificationEmptyState />;
  }, [isLoading]);

  // 리프레시 컨트롤
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        tintColor={colors.main}
        colors={[colors.main]}
      />
    ),
    [isRefetching, handleRefresh],
  );

  return (
    <BasePage touchableWithoutFeedback={false}>
      <Container>
        <NotificationListHeader
          onGoBack={handleGoBack}
          onMarkAllAsRead={handleMarkAllAsRead}
          hasUnread={hasUnread}
        />
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          refreshControl={refreshControl}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isEmpty || isLoading ? EMPTY_CONTENT_STYLE : undefined}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT_ESTIMATE,
            offset: ITEM_HEIGHT_ESTIMATE * index,
            index,
          })}
          // 규칙 6.1: FlatList 성능 최적화 옵션
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      </Container>
    </BasePage>
  );
}

/* Styled Components */

const EMPTY_CONTENT_STYLE = { flex: 1 };

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const Separator = styled.View({
  height: 1,
  backgroundColor: colors.gray06,
});

const FooterContainer = styled.View({
  paddingVertical: 20,
  alignItems: 'center',
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});
