import React from 'react';
import { MemoizedContentGridView } from './ContentGridView';
import { useFavoritesTab } from '../_hooks/useFavoritesTab';

/**
 * FavoritesTabView - 찜했어요 탭 뷰
 *
 * 찜한 콘텐츠 목록을 3열 그리드로 표시합니다.
 */
function FavoritesTabView() {
  const { items, isLoading, hasMore, fetchNextPage } = useFavoritesTab();

  return (
    <MemoizedContentGridView
      items={items}
      isLoading={isLoading}
      hasMore={hasMore}
      emptyMessage="찜한 콘텐츠가 없어요"
      emptySubMessage="마음에 드는 콘텐츠를 찜해보세요"
      showRating={false}
      onEndReached={fetchNextPage}
    />
  );
}

export const MemoizedFavoritesTabView = React.memo(FavoritesTabView);
