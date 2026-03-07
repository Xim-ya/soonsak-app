import React, { useMemo, useCallback } from 'react';
import { Tabs } from 'react-native-collapsible-tab-view';
import styled from '@emotion/native';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import type { UserContentItem } from '../_types';
import {
  MemoizedContentGridItem,
  GRID_ITEM_WIDTH,
  GRID_POSTER_HEIGHT,
  GRID_COLUMN_GAP,
} from './ContentGridItem';

/* 상수 정의 */
const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 16;
const SKELETON_ROW_COUNT = 5;
const ITEM_MARGIN_BOTTOM = 12;

interface ContentGridViewProps {
  readonly items: UserContentItem[];
  readonly isLoading: boolean;
  readonly hasMore: boolean;
  readonly emptyMessage: string;
  readonly emptySubMessage: string;
  readonly showRating?: boolean;
  readonly onEndReached?: () => void;
}

/* keyExtractor 함수 (컴포넌트 외부에 선언하여 재생성 방지) */
const keyExtractor = (item: UserContentItem) => item.id;

/* 스켈레톤 행 컴포넌트 */
const SkeletonRow = () => (
  <SkeletonRowContainer>
    {Array.from({ length: NUM_COLUMNS }).map((_, idx) => (
      <SkeletonItemContainer key={idx}>
        <SkeletonView width={GRID_ITEM_WIDTH} height={GRID_POSTER_HEIGHT} borderRadius={4} />
      </SkeletonItemContainer>
    ))}
  </SkeletonRowContainer>
);

/* 스켈레톤 그리드 컴포넌트 */
const SkeletonGrid = () => (
  <Tabs.ScrollView style={scrollViewStyle}>
    <GridContainer>
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
        <SkeletonRow key={rowIndex} />
      ))}
    </GridContainer>
  </Tabs.ScrollView>
);

/* 빈 상태 컴포넌트 */
interface EmptyStateProps {
  message: string;
  subMessage: string;
}

const EmptyState = ({ message, subMessage }: EmptyStateProps) => (
  <Tabs.ScrollView style={scrollViewStyle}>
    <EmptyContainer>
      <EmptyText>{message}</EmptyText>
      <EmptySubText>{subMessage}</EmptySubText>
    </EmptyContainer>
  </Tabs.ScrollView>
);

/* 추가 로딩 인디케이터 컴포넌트 */
const LoadingMoreIndicator = () => (
  <LoadingMoreContainer>
    <SkeletonRow />
  </LoadingMoreContainer>
);

/* 리스트 상단 여백 */
const ListHeaderSpacer = () => <HeaderSpacer />;

/* 스타일 상수 (인라인 객체 재생성 방지) */
const scrollViewStyle = { flex: 1 };

// 태블릿 최대 컨테이너 너비
const TABLET_MAX_WIDTH = 500;
const isLargeScreen = AppSize.isLargeScreen();

// FlatList 자체 스타일 (태블릿에서 가운데 정렬)
const flatListStyle = isLargeScreen
  ? { alignSelf: 'center' as const, width: TABLET_MAX_WIDTH }
  : undefined;

const columnWrapperStyle = {
  gap: GRID_COLUMN_GAP,
  paddingHorizontal: HORIZONTAL_PADDING,
};

const contentContainerStyle = {
  paddingBottom: 40,
};

/**
 * ContentGridView - 콘텐츠 그리드 뷰
 *
 * Tabs.FlatList를 사용하여 3열 그리드로 콘텐츠 목록을 표시합니다.
 * - 가상화로 메모리 효율성 향상
 * - 자동 무한 스크롤 처리
 * - 로딩, 빈 상태 UI 포함
 */
function ContentGridView({
  items,
  isLoading,
  emptyMessage,
  emptySubMessage,
  showRating = false,
  onEndReached,
}: ContentGridViewProps) {
  const isInitialLoading = isLoading && items.length === 0;
  const isEmpty = !isLoading && items.length === 0;

  // renderItem 메모이제이션 - showRating이 변경될 때만 재생성
  const renderItem = useCallback(
    ({ item }: { item: UserContentItem }) => (
      <MemoizedContentGridItem item={item} showRating={showRating} />
    ),
    [showRating],
  );

  // ListFooterComponent 메모이제이션
  const ListFooterComponent = useMemo(() => {
    if (isLoading && items.length > 0) {
      return <LoadingMoreIndicator />;
    }
    return null;
  }, [isLoading, items.length]);

  // 초기 로딩 상태
  if (isInitialLoading) {
    return <SkeletonGrid />;
  }

  // 빈 상태
  if (isEmpty) {
    return <EmptyState message={emptyMessage} subMessage={emptySubMessage} />;
  }

  return (
    <Tabs.FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      style={flatListStyle}
      columnWrapperStyle={columnWrapperStyle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      // 성능 최적화 옵션
      removeClippedSubviews={true}
      maxToRenderPerBatch={9}
      windowSize={5}
      initialNumToRender={12}
      // 무한 스크롤
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      // 상단 여백 (라이브러리 paddingTop 유지를 위해 ListHeader 사용)
      ListHeaderComponent={ListHeaderSpacer}
      // 로딩 인디케이터
      ListFooterComponent={ListFooterComponent}
    />
  );
}

/* Styled Components */
const GridContainer = styled.View({
  paddingHorizontal: HORIZONTAL_PADDING,
  paddingTop: 12,
  paddingBottom: 40,
});

const SkeletonRowContainer = styled.View({
  flexDirection: 'row',
  gap: GRID_COLUMN_GAP,
});

const SkeletonItemContainer = styled.View({
  width: GRID_ITEM_WIDTH,
  marginBottom: ITEM_MARGIN_BOTTOM,
});

const EmptyContainer = styled.View({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 100,
  paddingHorizontal: 24,
});

const EmptyText = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 8,
});

const EmptySubText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  textAlign: 'center',
});

const LoadingMoreContainer = styled.View({
  marginTop: 8,
  paddingHorizontal: HORIZONTAL_PADDING,
});

const HeaderSpacer = styled.View({
  height: 12,
});

export const MemoizedContentGridView = React.memo(ContentGridView);
