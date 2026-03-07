import React, { ReactElement, useCallback } from 'react';
import { FlatList, ListRenderItemInfo } from 'react-native';
import styled from '@emotion/native';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';

/** 홈 가로 카드 슬라이더 공통 상수 */
export const CARD_SLIDER = {
  ITEM_WIDTH: 220,
  ITEM_HEIGHT: 140,
  SEPARATOR_WIDTH: 12,
  /** 스냅 간격: 아이템 너비 + 간격 */
  SNAP_INTERVAL: 220 + 12,
} as const;

/** 아이템 간격 컴포넌트 */
const ItemSeparator = React.memo(() => <Gap size={CARD_SLIDER.SEPARATOR_WIDTH} />);
ItemSeparator.displayName = 'CardSliderItemSeparator';

/** FlatList getItemLayout (고정 크기 아이템 최적화) */
const getItemLayout = (_: unknown, index: number) => ({
  length: CARD_SLIDER.ITEM_WIDTH + CARD_SLIDER.SEPARATOR_WIDTH,
  offset: (CARD_SLIDER.ITEM_WIDTH + CARD_SLIDER.SEPARATOR_WIDTH) * index,
  index,
});

const LIST_CONTENT_STYLE = { paddingHorizontal: 16 };

const SKELETON_DATA: null[] = Array.from({ length: 5 }, () => null);

interface HorizontalCardSliderProps<T> {
  title: string;
  data: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  keyPrefix: string;
  renderItem: (info: ListRenderItemInfo<T | null>) => ReactElement | null;
}

/**
 * 홈 화면 가로 카드 슬라이더 공통 컴포넌트
 * FlatList + 섹션 타이틀 + 스켈레톤 + 최적화 설정을 포함
 */
function HorizontalCardSlider<T>({
  title,
  data,
  isLoading,
  isError,
  keyPrefix,
  renderItem,
}: HorizontalCardSliderProps<T>) {
  const keyExtractor = useCallback(
    (_: unknown, index: number) => `${keyPrefix}-${index}`,
    [keyPrefix],
  );

  if (isError) return null;
  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <SectionContainer>
      <SectionTitle>{title}</SectionTitle>
      <Gap size={7} />
      <FlatList
        horizontal
        data={isLoading ? (SKELETON_DATA as (T | null)[]) : data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={LIST_CONTENT_STYLE}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={3}
        snapToInterval={CARD_SLIDER.SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </SectionContainer>
  );
}

/* Shared Styled Components */

const SectionContainer = styled.View({
  marginTop: 40,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  paddingHorizontal: 16,
});

/** 스켈레톤 카드 박스 */
export const CardSkeletonBox = styled.View({
  width: CARD_SLIDER.ITEM_WIDTH,
  height: CARD_SLIDER.ITEM_HEIGHT,
  borderRadius: 4,
  backgroundColor: colors.gray05,
});

export { HorizontalCardSlider };
