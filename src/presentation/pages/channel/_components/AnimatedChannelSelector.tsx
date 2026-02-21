/**
 * AnimatedChannelSelector - 애니메이션 채널 선택 UI
 *
 * 스크롤에 따라 아바타 크기가 줄어드는 채널 선택 UI입니다.
 * Reanimated SharedValue를 받아 스크롤 위치에 따라 크기를 조절합니다.
 *
 * @example
 * <AnimatedChannelSelector
 *   channels={channels}
 *   selectedIds={selectedIds}
 *   onSelectionChange={handleSelectionChange}
 *   isLoading={isLoading}
 *   scrollY={scrollY}
 * />
 */

import React, { useCallback, useState } from 'react';
import { FlatList, TouchableOpacity, ListRenderItemInfo } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import styled from '@emotion/native';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { ChannelItemModel } from '../_types';
import {
  SkeletonModel,
  createSkeletonData,
  isSkeleton,
} from '@/presentation/components/skeleton/listSkeleton';

// 아바타 크기 상수
const AVATAR_SIZE_MAX = 64;
const AVATAR_SIZE_MIN = 44;
const ITEM_SEPARATOR = 12;

// 텍스트 영역 높이
const TEXT_AREA_HEIGHT = 36;

// 스크롤 범위 (이 범위 내에서 크기가 변함)
const SCROLL_RANGE = 60;

// 컨테이너 높이 (텍스트 영역 포함)
const CONTAINER_HEIGHT_MAX = AVATAR_SIZE_MAX + TEXT_AREA_HEIGHT + 20;
const CONTAINER_HEIGHT_MIN = AVATAR_SIZE_MAX + 8; // scale 변환 시 잘림 방지

/** 구독자 수 포맷 (만 단위) */
function formatSubscriberCount(count?: number): string {
  if (!count) return '';
  if (count >= 10000) {
    return `${Math.floor(count / 10000)}만`;
  }
  if (count >= 1000) {
    // 반올림 결과가 10 이상이면 만 단위로 표시 (예: 9950 -> 1만)
    const rounded = parseFloat((count / 1000).toFixed(1));
    if (rounded >= 10) {
      return '1만';
    }
    return `${rounded}천`;
  }
  return `${count}`;
}

type ListItem = ChannelItemModel | SkeletonModel;

const SKELETON_DATA = createSkeletonData(6);

interface AnimatedChannelSelectorProps {
  /** 채널 목록 */
  readonly channels: ChannelItemModel[];
  /** 선택된 채널 ID 목록 */
  readonly selectedIds: string[];
  /** 선택 변경 콜백 */
  readonly onSelectionChange: (ids: string[]) => void;
  /** 로딩 상태 */
  readonly isLoading: boolean;
  /** 스크롤 Y 값 (Reanimated SharedValue) */
  readonly scrollY: SharedValue<number>;
}

/**
 * 애니메이션 채널 아이템 컴포넌트
 */
const AnimatedChannelItem = React.memo(
  ({
    channel,
    isSelected,
    onPress,
    scrollY,
  }: {
    channel: ChannelItemModel;
    isSelected: boolean;
    onPress: (id: string) => void;
    scrollY: SharedValue<number>;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handlePress = useCallback(() => {
      onPress(channel.id);
    }, [channel.id, onPress]);

    const subscriberText = formatSubscriberCount(channel.subscriberCount);

    // 컨테이너 너비 애니메이션
    const animatedContainerStyle = useAnimatedStyle(() => {
      'worklet';
      const width = interpolate(
        scrollY.value,
        [0, SCROLL_RANGE],
        [AVATAR_SIZE_MAX + 6, AVATAR_SIZE_MIN + 6],
        Extrapolation.CLAMP,
      );
      return { width };
    });

    // 아바타 + 이미지 크기 애니메이션
    const animatedAvatarStyle = useAnimatedStyle(() => {
      'worklet';
      const size = interpolate(
        scrollY.value,
        [0, SCROLL_RANGE],
        [AVATAR_SIZE_MAX + 6, AVATAR_SIZE_MIN + 6],
        Extrapolation.CLAMP,
      );
      return { width: size, height: size, borderRadius: size / 2 };
    });

    // 이미지 크기 애니메이션 (border 제외)
    const animatedImageStyle = useAnimatedStyle(() => {
      'worklet';
      const size = interpolate(
        scrollY.value,
        [0, SCROLL_RANGE],
        [AVATAR_SIZE_MAX, AVATAR_SIZE_MIN],
        Extrapolation.CLAMP,
      );
      return { width: size, height: size, borderRadius: size / 2 };
    });

    // 텍스트 opacity 애니메이션
    const animatedTextStyle = useAnimatedStyle(() => {
      'worklet';
      const opacity = interpolate(
        scrollY.value,
        [0, SCROLL_RANGE * 0.5],
        [1, 0],
        Extrapolation.CLAMP,
      );
      return { opacity };
    });

    return (
      <Animated.View style={[{ alignItems: 'flex-start' }, animatedContainerStyle]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Animated.View
            style={[
              {
                borderWidth: isSelected ? 3 : 0,
                borderColor: isSelected ? colors.main : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor: colors.gray05,
              },
              animatedAvatarStyle,
            ]}
          >
            <Animated.Image
              source={{ uri: channel.logoUrl }}
              style={[animatedImageStyle, { opacity: isLoaded ? 1 : 0 }]}
              onLoad={() => setIsLoaded(true)}
            />
          </Animated.View>
        </TouchableOpacity>
        <Animated.View style={[{ marginTop: 4, overflow: 'hidden' }, animatedTextStyle]}>
          <ChannelName numberOfLines={1}>{channel.name}</ChannelName>
          {subscriberText && <SubscriberCount>{subscriberText}</SubscriberCount>}
        </Animated.View>
      </Animated.View>
    );
  },
);
AnimatedChannelItem.displayName = 'AnimatedChannelItem';

/**
 * 애니메이션 Skeleton 아이템 컴포넌트
 */
const AnimatedSkeletonItem = React.memo(({ scrollY }: { scrollY: SharedValue<number> }) => {
  const animatedContainerStyle = useAnimatedStyle(() => {
    'worklet';
    const width = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [AVATAR_SIZE_MAX + 6, AVATAR_SIZE_MIN + 6],
      Extrapolation.CLAMP,
    );
    return { width };
  });

  const animatedAvatarStyle = useAnimatedStyle(() => {
    'worklet';
    const size = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [AVATAR_SIZE_MAX, AVATAR_SIZE_MIN],
      Extrapolation.CLAMP,
    );
    return { width: size, height: size, borderRadius: size / 2 };
  });

  return (
    <Animated.View style={[{ alignItems: 'flex-start' }, animatedContainerStyle]}>
      <Animated.View style={[{ backgroundColor: colors.gray05 }, animatedAvatarStyle]} />
    </Animated.View>
  );
});
AnimatedSkeletonItem.displayName = 'AnimatedSkeletonItem';

/**
 * 아이템 간격 컴포넌트
 */
const ItemSeparator = React.memo(() => <Gap size={ITEM_SEPARATOR} />);
ItemSeparator.displayName = 'ItemSeparator';

const listContentStyle = { paddingHorizontal: 16 };

function AnimatedChannelSelector({
  channels,
  selectedIds,
  onSelectionChange,
  isLoading,
  scrollY,
}: AnimatedChannelSelectorProps) {
  const handleChannelPress = useCallback(
    (channelId: string) => {
      if (selectedIds.includes(channelId)) {
        onSelectionChange(selectedIds.filter((id) => id !== channelId));
      } else {
        onSelectionChange([...selectedIds, channelId]);
      }
    },
    [selectedIds, onSelectionChange],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => {
      if (isSkeleton(item)) {
        return <AnimatedSkeletonItem scrollY={scrollY} />;
      }
      return (
        <AnimatedChannelItem
          channel={item}
          isSelected={selectedIds.includes(item.id)}
          onPress={handleChannelPress}
          scrollY={scrollY}
        />
      );
    },
    [selectedIds, handleChannelPress, scrollY],
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const listData: ListItem[] = isLoading ? SKELETON_DATA : channels;

  // 컨테이너 높이 애니메이션
  const animatedContainerStyle = useAnimatedStyle(() => {
    'worklet';
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [CONTAINER_HEIGHT_MAX, CONTAINER_HEIGHT_MIN],
      Extrapolation.CLAMP,
    );
    return {
      height,
    };
  });

  if (!isLoading && channels.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.black,
          justifyContent: 'flex-start',
          paddingTop: 8,
        },
        animatedContainerStyle,
      ]}
    >
      <FlatList
        horizontal
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={3}
      />
    </Animated.View>
  );
}

/* Styled Components */
const ChannelName = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  textAlign: 'center',
  width: AVATAR_SIZE_MAX + 6,
});

const SubscriberCount = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  textAlign: 'center',
  marginTop: 2,
});

// 상수 export
export const CHANNEL_SELECTOR_HEIGHT_MAX = CONTAINER_HEIGHT_MAX;
export const CHANNEL_SELECTOR_HEIGHT_MIN = CONTAINER_HEIGHT_MIN;
export const CHANNEL_SELECTOR_SCROLL_RANGE = SCROLL_RANGE;

export { AnimatedChannelSelector };
