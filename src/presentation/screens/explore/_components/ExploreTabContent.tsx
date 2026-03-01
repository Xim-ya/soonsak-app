/**
 * ExploreTabContent - 탐색 탭 콘텐츠
 *
 * 각 정렬 탭의 콘텐츠를 표시합니다.
 * Tabs.FlatList를 사용하여 collapsible tab view와 통합됩니다.
 *
 * useExplore 훅을 통해 필터 상태와 콘텐츠 클릭 핸들러에 접근합니다.
 *
 * 반응형 그리드:
 * - 고정 카드 너비(MIN_CARD_WIDTH) 기준으로 열 수 자동 계산
 * - 폰: 2열 / 패블릿: 3열 / 태블릿: 4열+
 */

import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ListRenderItem, Platform, useWindowDimensions } from 'react-native';
import styled from '@emotion/native';
import { Tabs } from 'react-native-collapsible-tab-view';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { ShimmerSkeleton } from '@/presentation/components/image';
import type { ExploreSortType, ExploreContentModel } from '../_types/exploreTypes';
import { useExploreContents } from '../_hooks/useExploreContents';
import { useExplore } from '../_provider/ExploreProvider';
import {
  ExploreContentCard,
  calculateGridLayout,
  GRID_GAP,
  HORIZONTAL_PADDING,
} from './ExploreContentCard';

/** 그리드 아이템 타입 (실제 콘텐츠 또는 placeholder) */
type GridItem = ExploreContentModel | PlaceholderItem;

/** 마지막 행 정렬용 placeholder 아이템 */
interface PlaceholderItem {
  readonly id: number;
  readonly isPlaceholder: true;
}

/** placeholder 여부 타입 가드 */
function isPlaceholder(item: GridItem): item is PlaceholderItem {
  return 'isPlaceholder' in item && item.isPlaceholder === true;
}

// 스타일 상수 (인라인 객체 생성 방지)
const LIST_STYLE = { backgroundColor: colors.black };
const CONTENT_CONTAINER_STYLE = {
  flexGrow: 1,
  paddingBottom: 20,
  backgroundColor: colors.black,
};

interface ExploreTabContentProps {
  /** 정렬 타입 */
  readonly sortType: ExploreSortType;
}

interface SkeletonCardProps {
  readonly width: number;
  readonly height: number;
}

/** 스켈레톤 카드 컴포넌트 */
const SkeletonCard = React.memo(function SkeletonCard({ width, height }: SkeletonCardProps) {
  return <ShimmerSkeleton width={width} height={height} borderRadius={8} />;
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

interface SkeletonGridProps {
  readonly columnCount: number;
  readonly cardWidth: number;
  readonly cardHeight: number;
}

/** 스켈레톤 그리드 컴포넌트 */
const SkeletonGrid = React.memo(function SkeletonGrid({
  columnCount,
  cardWidth,
  cardHeight,
}: SkeletonGridProps) {
  // 2행 * columnCount개의 스켈레톤 표시
  const skeletonCount = columnCount * 2;

  return (
    <SkeletonContainer>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <SkeletonItemWrapper
          key={`skeleton-${index}`}
          cardWidth={cardWidth}
          isLastInRow={(index + 1) % columnCount === 0}
        >
          <SkeletonCard width={cardWidth} height={cardHeight} />
        </SkeletonItemWrapper>
      ))}
    </SkeletonContainer>
  );
});

const ExploreTabContent = React.memo(function ExploreTabContent({
  sortType,
}: ExploreTabContentProps): React.ReactElement {
  // Context에서 필터 상태와 콘텐츠 클릭 핸들러 가져오기
  const { filter, handleContentPress } = useExplore();

  const { contents, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useExploreContents(sortType, filter);

  // 반응형 화면 너비 (화면 크기 변경 시 자동 업데이트)
  const { width: windowWidth } = useWindowDimensions();

  // 동적 그리드 레이아웃 계산 (화면 너비 기반)
  const { columnCount, cardWidth, cardHeight } = useMemo(
    () => calculateGridLayout(windowWidth),
    [windowWidth],
  );

  // columnWrapperStyle을 동적으로 생성
  const columnWrapperStyle = useMemo(
    () => ({
      marginBottom: GRID_GAP,
      paddingHorizontal: HORIZONTAL_PADDING,
    }),
    [],
  );

  // 마지막 행 정렬을 위한 placeholder 추가
  const dataWithPlaceholders = useMemo((): GridItem[] => {
    if (contents.length === 0) return contents;

    const remainder = contents.length % columnCount;
    if (remainder === 0) return contents;

    // 마지막 행을 채우기 위한 placeholder 개수
    const placeholderCount = columnCount - remainder;
    const placeholders: PlaceholderItem[] = Array.from({ length: placeholderCount }, (_, i) => ({
      id: -1 - i, // 음수 ID로 placeholder 구분
      isPlaceholder: true as const,
    }));

    return [...contents, ...placeholders];
  }, [contents, columnCount]);

  const renderItem: ListRenderItem<GridItem> = useCallback(
    ({ item, index }) => {
      const isLastInRow = (index + 1) % columnCount === 0;

      // placeholder인 경우 빈 공간만 렌더링
      if (isPlaceholder(item)) {
        return <ItemWrapper cardWidth={cardWidth} isLastInRow={isLastInRow} />;
      }

      return (
        <ItemWrapper cardWidth={cardWidth} isLastInRow={isLastInRow}>
          <ExploreContentCard content={item} onPress={handleContentPress} cardWidth={cardWidth} />
        </ItemWrapper>
      );
    },
    [handleContentPress, columnCount, cardWidth],
  );

  const keyExtractor = useCallback((item: GridItem, index: number) => {
    // placeholder인 경우 index 기반 키 사용
    if (isPlaceholder(item)) {
      return `placeholder-${index}`;
    }
    return `${item.id}-${item.type}`;
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = useCallback(
    () => <LoadingFooter isFetchingNextPage={isFetchingNextPage} />,
    [isFetchingNextPage],
  );

  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <SkeletonGrid columnCount={columnCount} cardWidth={cardWidth} cardHeight={cardHeight} />
      );
    }
    return <EmptyState />;
  }, [isLoading, columnCount, cardWidth, cardHeight]);

  // contents 존재 여부에 따라 columnWrapperStyle 적용
  const hasContents = dataWithPlaceholders.length > 0;

  return (
    <Tabs.FlatList<GridItem>
      key={`grid-${columnCount}`} // 열 수 변경 시 FlatList 재생성
      data={dataWithPlaceholders}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={columnCount}
      style={LIST_STYLE}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      columnWrapperStyle={hasContents ? columnWrapperStyle : undefined}
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

interface ItemWrapperProps {
  cardWidth: number;
  isLastInRow: boolean;
}

const ItemWrapper = styled.View<ItemWrapperProps>(({ cardWidth, isLastInRow }) => ({
  width: cardWidth,
  marginRight: isLastInRow ? 0 : GRID_GAP,
}));

const SkeletonContainer = styled.View({
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingHorizontal: HORIZONTAL_PADDING,
  rowGap: GRID_GAP,
});

const SkeletonItemWrapper = styled.View<ItemWrapperProps>(({ cardWidth, isLastInRow }) => ({
  width: cardWidth,
  marginRight: isLastInRow ? 0 : GRID_GAP,
}));

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
