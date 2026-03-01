import React from 'react';
import { MemoizedContentGridView } from './ContentGridView';
import { useWatchedTab } from '../_hooks/useWatchedTab';

/**
 * WatchedTabView - 봤어요 탭 뷰
 *
 * 시청 완료한 콘텐츠 목록을 3열 그리드로 표시합니다.
 */
function WatchedTabView() {
  const { items, isLoading, hasMore, fetchNextPage } = useWatchedTab();

  return (
    <MemoizedContentGridView
      items={items}
      isLoading={isLoading}
      hasMore={hasMore}
      emptyMessage="시청 완료한 콘텐츠가 없어요"
      emptySubMessage="콘텐츠를 끝까지 시청해보세요"
      showRating={false}
      onEndReached={fetchNextPage}
    />
  );
}

export const MemoizedWatchedTabView = React.memo(WatchedTabView);
