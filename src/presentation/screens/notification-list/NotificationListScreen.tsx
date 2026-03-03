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
import {
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import styled from '@emotion/native';
import textStyles from '@/shared/styles/textStyles';
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
    isError,
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

  // 빈 상태, 에러 상태, 또는 초기 로딩
  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <ActivityIndicator color={colors.gray02} />
        </LoadingContainer>
      );
    }
    if (isError) {
      return (
        <ErrorContainer>
          <ErrorText>알림을 불러오지 못했어요</ErrorText>
          <RetryButton onPress={handleRefresh} activeOpacity={0.7}>
            <RetryButtonText>다시 시도</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      );
    }
    return <NotificationEmptyState />;
  }, [isLoading, isError, handleRefresh]);

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
          contentContainerStyle={isEmpty || isLoading || isError ? EMPTY_CONTENT_STYLE : undefined}
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

const ErrorContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
});

const ErrorText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});

const RetryButton = styled(TouchableOpacity)({
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 20,
  backgroundColor: colors.gray05,
});

const RetryButtonText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});
