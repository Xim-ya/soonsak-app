import React, { useCallback, useMemo } from 'react';
import { FlatList, TouchableOpacity, ListRenderItemInfo, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { ChannelLogoImage } from '@/presentation/components/image/ChannelLogoImage';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';
import { useFeaturedChannels } from '../_hooks/useFeaturedChannels';
import { FeaturedChannelModel } from '../_types/featuredChannelModel.home';
import {
  SkeletonModel,
  createSkeletonData,
  isSkeleton,
} from '@/presentation/components/skeleton/listSkeleton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 여러 곳에서 재사용되는 상수만 추출
const AVATAR_SIZE = 88;
const ITEM_SEPARATOR = 12;

type _ListItem = FeaturedChannelModel | SkeletonModel;

const _SKELETON_DATA = createSkeletonData(5);

/**
 * 채널 아이템 컴포넌트
 */
const ChannelItem = React.memo(({ channel }: { channel: FeaturedChannelModel }) => {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = useCallback(() => {
    navigation.navigate(routePages.channelDetail, {
      channelId: channel.id,
      channelName: channel.name,
      channelLogoUrl: channel.logoUrl,
      subscriberCount: channel.subscriberCount,
    });
  }, [navigation, channel]);

  return (
    <ItemContainer>
      <ItemTouchable onPress={handlePress} activeOpacity={0.8}>
        <ChannelLogoImage source={channel.logoUrl} size={AVATAR_SIZE} />
        <Gap size={10} />
        <ChannelNameText numberOfLines={1}>{channel.name}</ChannelNameText>
      </ItemTouchable>
    </ItemContainer>
  );
});
ChannelItem.displayName = 'ChannelItem';

/**
 * Skeleton 아이템 컴포넌트
 */
const ChannelSkeletonItem = React.memo(() => (
  <ItemContainer>
    <SkeletonCircle />
    <Gap size={10} />
    <SkeletonText />
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

const listContentStyle = { paddingHorizontal: 18 };

/**
 * 대표 채널 섹션
 * Flutter: _ChannelSlider 위젯 참고
 */
function FeaturedChannelSectionView() {
  const navigation = useNavigation<NavigationProp>();
  const { data: channels, isLoading, isError } = useFeaturedChannels();

  // 전체 채널 목록으로 이동
  const handleTitlePress = useCallback(() => {
    navigation.navigate(routePages.channelAll);
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<_ListItem>) =>
      isSkeleton(item) ? <ChannelSkeletonItem /> : <ChannelItem channel={item} />,
    [],
  );

  const keyExtractor = useCallback((item: _ListItem) => item.id, []);

  const listData = useMemo(
    (): _ListItem[] => (isLoading ? _SKELETON_DATA : channels),
    [isLoading, channels],
  );

  if (isError) {
    return null;
  }

  if (!isLoading && channels.length === 0) {
    return null;
  }

  return (
    <Container>
      <Pressable onPress={handleTitlePress}>
        <TitleRow>
          <SectionTitle>놓치지 말아야 할 리뷰 채널</SectionTitle>
          <RightArrowIcon width={20} height={20} />
        </TitleRow>
      </Pressable>
      <Gap size={12} />
      <ListContainer>
        <FlatList
          horizontal
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={listContentStyle}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
        />
      </ListContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  marginTop: 40,
});

const TitleRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const ListContainer = styled.View({
  height: 114,
});

const ItemContainer = styled.View({
  width: AVATAR_SIZE,
  alignItems: 'center',
});

const ItemTouchable = styled(TouchableOpacity)({
  alignItems: 'center',
});

const ChannelNameText = styled.Text({
  ...textStyles.desc,
  color: colors.gray01,
  width: AVATAR_SIZE,
  textAlign: 'center',
});

const SkeletonCircle = styled.View({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: AVATAR_SIZE / 2,
  backgroundColor: colors.gray05,
});

const SkeletonText = styled.View({
  width: 60,
  height: 12,
  borderRadius: 4,
  backgroundColor: colors.gray05,
});

export { FeaturedChannelSectionView };
