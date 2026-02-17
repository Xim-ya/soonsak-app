import { Tabs } from 'react-native-collapsible-tab-view';
import React, { useMemo } from 'react';
import styled from '@emotion/native';
import type { SharedValue } from 'react-native-reanimated';

import { useTabScrollListener } from '../_hooks/useTabScrollListener';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';
import { useContentDetail } from '../_hooks/useContentDetail';
import { useEnhancedRelatedContents } from '../_hooks/useEnhancedRelatedContents';
import {
  MemoizedRelatedContentGridItem,
  GRID_ITEM_WIDTH,
  GRID_POSTER_HEIGHT,
  GRID_COLUMN_GAP,
} from './RelatedContentGridItem';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

/**
 * RelatedContentTabView - 관련 콘텐츠 탭 뷰
 *
 * TMDB 추천 + 장르 기반으로 관련 콘텐츠를 18개까지 3열 그리드로 표시합니다.
 */
function RelatedContentTabView({ appBarOpacity }: { appBarOpacity: SharedValue<number> }) {
  useTabScrollListener(appBarOpacity);

  const { id: contentId, type: contentType } = useContentDetailRoute();
  const { data: contentDetail, isLoading: isDetailLoading } = useContentDetail(
    contentId,
    contentType,
  );

  // 장르 ID 추출 (ContentDetailModel의 genres는 GenreDto[] 형태)
  const genreIds = useMemo(() => {
    return contentDetail?.genres?.map((genre) => genre.id) ?? [];
  }, [contentDetail?.genres]);

  const { data: relatedContents, isLoading: isRelatedLoading } = useEnhancedRelatedContents({
    contentId,
    contentType,
    genreIds,
  });

  const isLoading = isDetailLoading || isRelatedLoading;
  const isEmpty = !isLoading && relatedContents.length === 0;

  // 3열 그리드로 아이템 그룹화
  const rows = useMemo(() => {
    const result: (typeof relatedContents)[] = [];
    for (let i = 0; i < relatedContents.length; i += 3) {
      result.push(relatedContents.slice(i, i + 3));
    }
    return result;
  }, [relatedContents]);

  // 스켈레톤 로딩 UI (3x3 그리드)
  if (isLoading) {
    return (
      <Tabs.ScrollView style={{ flex: 1 }}>
        <GridContainer>
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <Row key={rowIndex}>
              {Array.from({ length: 3 }).map((_, colIndex) => (
                <SkeletonItemContainer key={colIndex}>
                  <SkeletonView
                    width={GRID_ITEM_WIDTH}
                    height={GRID_POSTER_HEIGHT}
                    borderRadius={4}
                  />
                </SkeletonItemContainer>
              ))}
            </Row>
          ))}
        </GridContainer>
      </Tabs.ScrollView>
    );
  }

  // 빈 상태 UI
  if (isEmpty) {
    return (
      <Tabs.ScrollView style={{ flex: 1 }}>
        <EmptyContainer>
          <EmptyText>관련 콘텐츠가 없습니다.</EmptyText>
          <EmptySubText>비슷한 콘텐츠를 찾을 수 없어요.</EmptySubText>
        </EmptyContainer>
      </Tabs.ScrollView>
    );
  }

  return (
    <Tabs.ScrollView style={{ flex: 1 }}>
      <GridContainer>
        {rows.map((row, rowIndex) => (
          <Row key={rowIndex}>
            {row.map((content) => (
              <MemoizedRelatedContentGridItem key={content.id} content={content} />
            ))}
            {/* 마지막 행이 3개 미만일 때 빈 공간 채우기 */}
            {row.length < 3 &&
              Array.from({ length: 3 - row.length }).map((_, idx) => (
                <EmptyGridItem key={`empty-${idx}`} />
              ))}
          </Row>
        ))}
      </GridContainer>
    </Tabs.ScrollView>
  );
}

/* Styled Components */
const GridContainer = styled.View({
  paddingHorizontal: 16,
  paddingTop: 20,
  paddingBottom: 40,
});

const Row = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 0,
  gap: GRID_COLUMN_GAP,
});

const SkeletonItemContainer = styled.View({
  width: GRID_ITEM_WIDTH,
  marginBottom: 12,
});

const EmptyGridItem = styled.View({
  width: GRID_ITEM_WIDTH,
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

const MemoizedRelatedContentTabView = React.memo(RelatedContentTabView);
MemoizedRelatedContentTabView.displayName = 'RelatedContentTabView';

export { MemoizedRelatedContentTabView as RelatedContentTabView };
