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
  useDerivedValue,
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
const CONTAINER_HEIGHT_MIN = AVATAR_SIZE_MAX + 8;

// 스타일 상수 (인라인 객체 생성 방지)
const itemContainerBaseStyle = { alignItems: 'flex-start' as const };
const avatarBaseStyle = {
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  overflow: 'hidden' as const,
  backgroundColor: colors.gray05,
};
const textWrapperBaseStyle = { marginTop: 4, overflow: 'hidden' as const };
const skeletonBaseStyle = { backgroundColor: colors.gray05 };

// 선택 상태 border 스타일 상수 (useMemo 오버헤드 제거)
const selectedBorderStyle = {
  borderWidth: 3,
  borderColor: colors.main,
};
const unselectedBorderStyle = {
  borderWidth: 0,
  borderColor: 'transparent',
};

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
 * animatedSize를 부모에서 받아 중복 계산 방지
 */
const AnimatedChannelItem = React.memo(
  ({
    channel,
    isSelected,
    onPress,
    animatedSize,
  }: {
    channel: ChannelItemModel;
    isSelected: boolean;
    onPress: (id: string) => void;
    animatedSize: SharedValue<number>;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handlePress = useCallback(() => {
      onPress(channel.id);
    }, [channel.id, onPress]);

    const subscriberText = formatSubscriberCount(channel.subscriberCount);

    // 선택 상태 border 스타일 (상수 재사용)
    const borderStyle = isSelected ? selectedBorderStyle : unselectedBorderStyle;

    // 개별 애니메이션 스타일 (부모에서 전달받은 animatedSize 사용)
    const containerStyle = useAnimatedStyle(() => {
      'worklet';
      const width = (AVATAR_SIZE_MAX + 6) * animatedSize.value;
      return { width };
    });

    const avatarStyle = useAnimatedStyle(() => {
      'worklet';
      const size = (AVATAR_SIZE_MAX + 6) * animatedSize.value;
      return { width: size, height: size, borderRadius: size / 2 };
    });

    const imageStyle = useAnimatedStyle(() => {
      'worklet';
      const size = AVATAR_SIZE_MAX * animatedSize.value;
      return { width: size, height: size, borderRadius: size / 2 };
    });

    const textStyle = useAnimatedStyle(() => {
      'worklet';
      const opacity = interpolate(
        animatedSize.value,
        [AVATAR_SIZE_MIN / AVATAR_SIZE_MAX, 1],
        [0, 1],
        Extrapolation.CLAMP,
      );
      return { opacity };
    });

    return (
      <Animated.View style={[itemContainerBaseStyle, containerStyle]}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Animated.View style={[avatarBaseStyle, borderStyle, avatarStyle]}>
            <Animated.Image
              source={{ uri: channel.logoUrl }}
              style={[imageStyle, { opacity: isLoaded ? 1 : 0 }]}
              onLoad={() => setIsLoaded(true)}
            />
          </Animated.View>
        </TouchableOpacity>
        <Animated.View style={[textWrapperBaseStyle, textStyle]}>
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
 * animatedSize를 부모에서 받아 중복 계산 방지
 */
const AnimatedSkeletonItem = React.memo(
  ({ animatedSize }: { animatedSize: SharedValue<number> }) => {
    const containerStyle = useAnimatedStyle(() => {
      'worklet';
      const width = (AVATAR_SIZE_MAX + 6) * animatedSize.value;
      return { width };
    });

    const avatarStyle = useAnimatedStyle(() => {
      'worklet';
      const size = AVATAR_SIZE_MAX * animatedSize.value;
      return { width: size, height: size, borderRadius: size / 2 };
    });

    return (
      <Animated.View style={[itemContainerBaseStyle, containerStyle]}>
        <Animated.View style={[skeletonBaseStyle, avatarStyle]} />
      </Animated.View>
    );
  },
);
AnimatedSkeletonItem.displayName = 'AnimatedSkeletonItem';

/**
 * 아이템 간격 컴포넌트
 */
const ItemSeparator = React.memo(() => <Gap size={ITEM_SEPARATOR} />);
ItemSeparator.displayName = 'ItemSeparator';

const listContentStyle = { paddingHorizontal: 16 };

// 컨테이너 기본 스타일 (컴포넌트 외부로 이동)
const containerBaseStyle = {
  backgroundColor: colors.black,
  justifyContent: 'flex-start' as const,
  paddingTop: 8,
};

function AnimatedChannelSelector({
  channels,
  selectedIds,
  onSelectionChange,
  isLoading,
  scrollY,
}: AnimatedChannelSelectorProps) {
  // 모든 아이템이 공유할 크기 값 (한 번만 계산)
  const sharedAnimatedSize = useDerivedValue(() => {
    'worklet';
    return interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [1, AVATAR_SIZE_MIN / AVATAR_SIZE_MAX],
      Extrapolation.CLAMP,
    );
  });

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
        return <AnimatedSkeletonItem animatedSize={sharedAnimatedSize} />;
      }
      return (
        <AnimatedChannelItem
          channel={item}
          isSelected={selectedIds.includes(item.id)}
          onPress={handleChannelPress}
          animatedSize={sharedAnimatedSize}
        />
      );
    },
    [selectedIds, handleChannelPress, sharedAnimatedSize],
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
    <Animated.View style={[containerBaseStyle, animatedContainerStyle]}>
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
