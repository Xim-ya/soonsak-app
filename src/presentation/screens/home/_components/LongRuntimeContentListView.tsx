import React, { useCallback } from 'react';
import { ListRenderItemInfo } from 'react-native';
import styled from '@emotion/native';
import DarkChip from '@/presentation/components/chip/DarkChip';
import {
  HorizontalCardSlider,
  CardSkeletonBox,
} from '@/presentation/components/slider/HorizontalCardSlider';
import { ContentCardImage } from '@/presentation/components/card/ContentCardImage';
import { useLongRuntimeContents } from '../_hooks/useLongRuntimeContents';
import { LongRuntimeContentModel } from '../_types/longRuntimeContentModel.home';

const TITLE_LEFT_OFFSET = 60;

/**
 * 러닝타임 긴 콘텐츠 아이템 컴포넌트
 */
const LongRuntimeItem = React.memo(({ item }: { item: LongRuntimeContentModel }) => (
  <ContentCardImage
    item={item}
    titleLeftOffset={TITLE_LEFT_OFFSET}
    overlay={
      <RuntimeChipWrapper>
        <DarkChip content={item.formattedRuntime} />
      </RuntimeChipWrapper>
    }
  />
));
LongRuntimeItem.displayName = 'LongRuntimeItem';

/**
 * Skeleton 아이템 컴포넌트
 */
const LongRuntimeSkeletonItem = React.memo(() => <CardSkeletonBox />);
LongRuntimeSkeletonItem.displayName = 'LongRuntimeSkeletonItem';

/**
 * 러닝타임이 긴 콘텐츠 슬라이더
 */
function LongRuntimeContentListView() {
  const { data: contents, isLoading, isError } = useLongRuntimeContents();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LongRuntimeContentModel | null>) =>
      !item ? <LongRuntimeSkeletonItem /> : <LongRuntimeItem item={item} />,
    [],
  );

  return (
    <HorizontalCardSlider
      title="러닝타임이 긴 콘텐츠"
      data={contents}
      isLoading={isLoading}
      isError={isError}
      keyPrefix="long-runtime"
      renderItem={renderItem}
    />
  );
}

/* Styled Components */

const RuntimeChipWrapper = styled.View({
  position: 'absolute',
  left: 8,
  bottom: 8,
});

export { LongRuntimeContentListView };
