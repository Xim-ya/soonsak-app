import React from 'react';
import { MemoizedContentGridView } from './ContentGridView';
import { useRatingsTab } from '../_hooks/useRatingsTab';

/**
 * RatingsTabView - 평가했어요 탭 뷰
 *
 * 평가한 콘텐츠 목록을 3열 그리드로 표시합니다.
 * 각 콘텐츠에 별점 오버레이가 표시됩니다.
 */
function RatingsTabView() {
  const { items, isLoading, hasMore, fetchNextPage } = useRatingsTab();

  return (
    <MemoizedContentGridView
      items={items}
      isLoading={isLoading}
      hasMore={hasMore}
      emptyMessage="평가한 콘텐츠가 없어요"
      emptySubMessage="콘텐츠를 시청하고 별점을 남겨보세요"
      showRating={true}
      onEndReached={fetchNextPage}
    />
  );
}

export const MemoizedRatingsTabView = React.memo(RatingsTabView);
