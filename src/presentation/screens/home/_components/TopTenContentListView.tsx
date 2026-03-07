import React, { useCallback } from 'react';
import { ListRenderItemInfo } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { formatter } from '@/core/utils/formatter';
import {
  HorizontalCardSlider,
  CARD_SLIDER,
  CardSkeletonBox,
} from '@/presentation/components/slider/HorizontalCardSlider';
import { ContentCardImage } from '@/presentation/components/card/ContentCardImage';
import { ContentSource } from '@/core/services/analytics';
import { useWeeklyTopTen } from '../_hooks/useWeeklyTopTen';
import { TopTenContentModel } from '../_types/topTenContentModel.home';

const CONTAINER_HEIGHT = 168;
const TITLE_LEFT_OFFSET = 60;

/**
 * Top 10 아이템 컴포넌트
 */
const TopTenItem = React.memo(({ item }: { item: TopTenContentModel }) => (
  <ItemContainer>
    <ContentCardImage
      item={item}
      titleLeftOffset={TITLE_LEFT_OFFSET}
      source={ContentSource.HOME_TOP10}
    />
    <RankBadge>
      <RankText>{formatter.toOrdinal(item.rank)}</RankText>
    </RankBadge>
  </ItemContainer>
));
TopTenItem.displayName = 'TopTenItem';

/**
 * Skeleton 아이템 컴포넌트
 */
const TopTenSkeletonItem = React.memo(() => (
  <ItemContainer>
    <CardSkeletonBox />
  </ItemContainer>
));
TopTenSkeletonItem.displayName = 'TopTenSkeletonItem';

/**
 * 주간 Top 10 콘텐츠 슬라이더
 */
function TopTenContentListView() {
  const { data: topTenContents, isLoading, isError } = useWeeklyTopTen();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TopTenContentModel | null>) =>
      !item ? <TopTenSkeletonItem /> : <TopTenItem item={item} />,
    [],
  );

  return (
    <HorizontalCardSlider
      title="이번주 인기작 TOP 10"
      data={topTenContents}
      isLoading={isLoading}
      isError={isError}
      keyPrefix="top-ten"
      renderItem={renderItem}
    />
  );
}

/* Styled Components */

const ItemContainer = styled.View({
  width: CARD_SLIDER.ITEM_WIDTH,
  height: CONTAINER_HEIGHT,
  position: 'relative',
});

const RankBadge = styled.View({
  position: 'absolute',
  left: -4,
  bottom: 13.5,
});

const RankText = styled.Text({
  ...textStyles.web2,
  color: colors.white,
});

export { TopTenContentListView };
