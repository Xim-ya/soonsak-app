/**
 * ChannelSelector - 채널 선택 UI
 *
 * 수평 스크롤 가능한 채널 아바타 목록을 표시합니다.
 * 멀티셀렉트를 지원하며, 선택된 채널은 녹색 테두리로 표시됩니다.
 *
 * @example
 * <ChannelSelector
 *   channels={channels}
 *   selectedIds={selectedIds}
 *   onSelectionChange={handleSelectionChange}
 *   isLoading={isLoading}
 * />
 */

import React, { useCallback } from 'react';
import { FlatList, TouchableOpacity, ListRenderItemInfo } from 'react-native';
import styled from '@emotion/native';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import type { ChannelItemModel } from '../_types';
import {
  SkeletonModel,
  createSkeletonData,
  isSkeleton,
} from '@/presentation/components/skeleton/listSkeleton';

// 아바타 크기 상수
const AVATAR_SIZE = 64;
const ITEM_SEPARATOR = 12;

type ListItem = ChannelItemModel | SkeletonModel;

const SKELETON_DATA = createSkeletonData(6);

interface ChannelSelectorProps {
  /** 채널 목록 */
  readonly channels: ChannelItemModel[];
  /** 선택된 채널 ID 목록 */
  readonly selectedIds: string[];
  /** 선택 변경 콜백 */
  readonly onSelectionChange: (ids: string[]) => void;
  /** 로딩 상태 */
  readonly isLoading: boolean;
}

/**
 * 채널 아이템 컴포넌트
 */
const ChannelItem = React.memo(
  ({
    channel,
    isSelected,
    onPress,
  }: {
    channel: ChannelItemModel;
    isSelected: boolean;
    onPress: (id: string) => void;
  }) => {
    const handlePress = useCallback(() => {
      onPress(channel.id);
    }, [channel.id, onPress]);

    return (
      <ItemContainer>
        <ItemTouchable onPress={handlePress} activeOpacity={0.8}>
          <AvatarWrapper isSelected={isSelected}>
            <RoundedAvatorView source={channel.logoUrl} size={AVATAR_SIZE} />
          </AvatarWrapper>
        </ItemTouchable>
      </ItemContainer>
    );
  },
);
ChannelItem.displayName = 'ChannelItem';

/**
 * Skeleton 아이템 컴포넌트
 */
const ChannelSkeletonItem = React.memo(() => (
  <ItemContainer>
    <SkeletonCircle />
  </ItemContainer>
));
ChannelSkeletonItem.displayName = 'ChannelSkeletonItem';

/**
 * 아이템 간격 컴포넌트
 */
const ItemSeparator = React.memo(() => <Gap size={ITEM_SEPARATOR} />);
ItemSeparator.displayName = 'ItemSeparator';

/**
 * FlatList getItemLayout (고정 크기 아이템 최적화)
 */
const getItemLayout = (_: unknown, index: number) => ({
  length: AVATAR_SIZE,
  offset: (AVATAR_SIZE + ITEM_SEPARATOR) * index,
  index,
});

const listContentStyle = { paddingHorizontal: 16 };

function ChannelSelector({
  channels,
  selectedIds,
  onSelectionChange,
  isLoading,
}: ChannelSelectorProps) {
  const handleChannelPress = useCallback(
    (channelId: string) => {
      if (selectedIds.includes(channelId)) {
        // 이미 선택된 경우 해제
        onSelectionChange(selectedIds.filter((id) => id !== channelId));
      } else {
        // 선택 추가
        onSelectionChange([...selectedIds, channelId]);
      }
    },
    [selectedIds, onSelectionChange],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => {
      if (isSkeleton(item)) {
        return <ChannelSkeletonItem />;
      }
      return (
        <ChannelItem
          channel={item}
          isSelected={selectedIds.includes(item.id)}
          onPress={handleChannelPress}
        />
      );
    },
    [selectedIds, handleChannelPress],
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const listData: ListItem[] = isLoading ? SKELETON_DATA : channels;

  if (!isLoading && channels.length === 0) {
    return null;
  }

  return (
    <Container>
      <FlatList
        horizontal
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={3}
      />
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  height: AVATAR_SIZE + 8, // 아바타 + 선택 테두리 여백
});

const ItemContainer = styled.View({
  width: AVATAR_SIZE + 6, // 선택 테두리 여백 포함
  alignItems: 'center',
});

const ItemTouchable = styled(TouchableOpacity)({
  alignItems: 'center',
});

const AvatarWrapper = styled.View<{ isSelected: boolean }>(({ isSelected }) => ({
  width: AVATAR_SIZE + 6,
  height: AVATAR_SIZE + 6,
  borderRadius: (AVATAR_SIZE + 6) / 2,
  borderWidth: isSelected ? 3 : 0,
  borderColor: isSelected ? colors.main : 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
}));

const SkeletonCircle = styled.View({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: AVATAR_SIZE / 2,
  backgroundColor: colors.gray05,
});

export { ChannelSelector };
