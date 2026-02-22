/**
 * ExploreTabContent - 탐색 탭 콘텐츠
 *
 * 각 정렬 탭의 콘텐츠를 표시합니다.
 * Tabs.FlatList를 사용하여 collapsible tab view와 통합됩니다.
 */

import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ListRenderItem, Platform } from 'react-native';
import styled from '@emotion/native';
import { Tabs } from 'react-native-collapsible-tab-view';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { ShimmerSkeleton } from '@/presentation/components/image';
import type { ContentFilter } from '@/shared/types/filter/contentFilter';
import type { ExploreSortType, ExploreContentModel } from '../_types/exploreTypes';
import { useExploreContents } from '../_hooks/useExploreContents';
import {
  ExploreContentCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  GRID_GAP,
  HORIZONTAL_PADDING,
} from './ExploreContentCard';

const COLUMN_COUNT = 2;
const SKELETON_COUNT = 6;

// 스타일 상수 (인라인 객체 생성 방지)
const LIST_STYLE = { backgroundColor: colors.black };
const CONTENT_CONTAINER_STYLE = {
  paddingBottom: 20,
  backgroundColor: colors.black,
};
const COLUMN_WRAPPER_STYLE = {
  marginBottom: GRID_GAP,
  paddingHorizontal: HORIZONTAL_PADDING,
};

interface ExploreTabContentProps {
  /** 정렬 타입 */
  readonly sortType: ExploreSortType;
  /** 필터 상태 */
  readonly filter: ContentFilter;
  /** 콘텐츠 클릭 콜백 */
  readonly onContentPress: (content: ExploreContentModel) => void;
}

/** 스켈레톤 카드 컴포넌트 */
const SkeletonCard = React.memo(function SkeletonCard() {
  return <ShimmerSkeleton width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={8} />;
});

/** 빈 상태 컴포넌트 */
const EmptyState = React.memo(function EmptyState() {
  return (
    <EmptyContainer>
      <EmptyText>검색 결과가 없습니다</EmptyText>
      <EmptySubText>다른 필터 조건을 선택해보세요</EmptySubText>
    </EmptyContainer>
  );
});

/** 로딩 인디케이터 컴포넌트 */
const LoadingFooter = React.memo(function LoadingFooter({
  isFetchingNextPage,
}: {
  isFetchingNextPage: boolean;
}) {
  if (!isFetchingNextPage) return null;

  return (
    <FooterContainer>
      <ActivityIndicator color={colors.gray02} />
    </FooterContainer>
  );
});

const ExploreTabContent = React.memo(function ExploreTabContent({
  sortType,
  filter,
  onContentPress,
}: ExploreTabContentProps): React.ReactElement {
  const { contents, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useExploreContents(sortType, filter);

  const renderItem: ListRenderItem<ExploreContentModel> = useCallback(
    ({ item, index }) => {
      const isLeftColumn = index % 2 === 0;
      return (
        <ItemWrapper isLeftColumn={isLeftColumn}>
          <ExploreContentCard content={item} onPress={onContentPress} />
        </ItemWrapper>
      );
    },
    [onContentPress],
  );

  const keyExtractor = useCallback((item: ExploreContentModel) => `${item.id}-${item.type}`, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = useCallback(
    () => <LoadingFooter isFetchingNextPage={isFetchingNextPage} />,
    [isFetchingNextPage],
  );

  const renderSkeleton = useMemo(() => {
    return (
      <SkeletonGrid>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <ItemWrapper key={`skeleton-${index}`} isLeftColumn={index % 2 === 0}>
            <SkeletonCard />
          </ItemWrapper>
        ))}
      </SkeletonGrid>
    );
  }, []);

  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return renderSkeleton;
    }
    return <EmptyState />;
  }, [isLoading, renderSkeleton]);

  // columnWrapperStyle 메모이제이션 (contents 존재 여부 변경 시에만 재계산)
  const hasContents = contents.length > 0;
  const columnWrapperStyle = useMemo(
    () => (hasContents ? COLUMN_WRAPPER_STYLE : undefined),
    [hasContents],
  );

  return (
    <Tabs.FlatList
      data={contents}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={COLUMN_COUNT}
      style={LIST_STYLE}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      columnWrapperStyle={columnWrapperStyle}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderListEmpty}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={Platform.OS === 'android' ? 1 : 16}
      nestedScrollEnabled={Platform.OS === 'android'}
    />
  );
});

const ItemWrapper = styled.View<{ isLeftColumn: boolean }>(({ isLeftColumn }) => ({
  width: CARD_WIDTH,
  marginRight: isLeftColumn ? GRID_GAP : 0,
}));

const SkeletonGrid = styled.View({
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingHorizontal: HORIZONTAL_PADDING,
  paddingTop: 16,
});

const EmptyContainer = styled.View({
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 100,
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

const FooterContainer = styled.View({
  paddingVertical: 20,
  alignItems: 'center',
});

export { ExploreTabContent };
