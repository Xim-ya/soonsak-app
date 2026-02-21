/**
 * ChannelPage - 채널 탭 화면
 *
 * 다양한 채널의 비디오를 탐색할 수 있는 화면입니다.
 * 상단에서 채널을 선택하고, 정렬 옵션을 변경하여 비디오를 필터링할 수 있습니다.
 * 스크롤 시 채널 선택 영역이 축소되며 상단에 고정됩니다.
 */

import { useCallback, useState } from 'react';
import { ActivityIndicator, ListRenderItem, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedRef,
  runOnJS,
} from 'react-native-reanimated';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { BasePage } from '@/presentation/components/page/BasePage';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import Gap from '@/presentation/components/view/Gap';
import type { ChannelSortType, ChannelVideoModel } from './_types';
import { useChannelList } from './_hooks/useChannelList';
import { useChannelVideos } from './_hooks/useChannelVideos';
import {
  AnimatedChannelSelector,
  CHANNEL_SELECTOR_HEIGHT_MAX,
  CHANNEL_SELECTOR_HEIGHT_MIN,
  CHANNEL_SELECTOR_SCROLL_RANGE,
} from './_components/AnimatedChannelSelector';
import { ChannelVideoCard } from './_components/ChannelVideoCard';
import { SortSelector } from './_components/SortSelector';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ITEM_SEPARATOR_HEIGHT = 24;
const FILTER_BAR_HEIGHT = 44;
const HEADER_ROW_HEIGHT = 56;

export default function ChannelPage() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // 스크롤 값 추적
  const scrollY = useSharedValue(0);
  const listRef = useAnimatedRef<Animated.FlatList<ChannelVideoModel>>();

  // 채널 선택 상태
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);

  // 정렬 상태 (기본값: 전체/랜덤)
  const [sortType, setSortType] = useState<ChannelSortType>('all');

  // 채널 목록 조회
  const { channels, isLoading: isChannelsLoading } = useChannelList();

  // 비디오 목록 조회
  const { videos, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChannelVideos(
    selectedChannelIds,
    sortType,
  );

  // 스냅 임계값 (이 값보다 작으면 0으로, 크면 SCROLL_RANGE로 스냅)
  const SNAP_THRESHOLD = CHANNEL_SELECTOR_SCROLL_RANGE / 2;

  // 스크롤 스냅 함수
  const snapToPosition = useCallback((targetY: number) => {
    listRef.current?.scrollToOffset({ offset: targetY, animated: true });
  }, []);

  // 스크롤 핸들러
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onEndDrag: (event) => {
      const y = event.contentOffset.y;
      // 스크롤 범위 내에서만 스냅 적용
      if (y > 0 && y < CHANNEL_SELECTOR_SCROLL_RANGE) {
        const targetY = y < SNAP_THRESHOLD ? 0 : CHANNEL_SELECTOR_SCROLL_RANGE;
        runOnJS(snapToPosition)(targetY);
      }
    },
    onMomentumEnd: (event) => {
      const y = event.contentOffset.y;
      // 모멘텀 스크롤 후에도 스냅 적용
      if (y > 0 && y < CHANNEL_SELECTOR_SCROLL_RANGE) {
        const targetY = y < SNAP_THRESHOLD ? 0 : CHANNEL_SELECTOR_SCROLL_RANGE;
        runOnJS(snapToPosition)(targetY);
      }
    },
  });

  // 비디오 클릭 핸들러
  const handleVideoPress = useCallback(
    (video: ChannelVideoModel) => {
      navigation.navigate(routePages.player, {
        videoId: video.videoId,
        title: video.videoTitle,
        contentId: video.contentId,
        contentType: video.contentType,
      });
    },
    [navigation],
  );

  // 채널 선택 변경 핸들러
  const handleChannelSelectionChange = useCallback((ids: string[]) => {
    setSelectedChannelIds(ids);
  }, []);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((newSortType: ChannelSortType) => {
    setSortType(newSortType);
  }, []);

  // 더보기(전체 채널) 핸들러
  const handleViewAllChannels = useCallback(() => {
    // TODO: 전체 채널 리스트 페이지로 이동
  }, []);

  // 무한 스크롤 핸들러
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 비디오 아이템 렌더
  const renderVideoItem: ListRenderItem<ChannelVideoModel> = useCallback(
    ({ item }) => <ChannelVideoCard video={item} onPress={handleVideoPress} />,
    [handleVideoPress],
  );

  // 아이템 키 추출
  const keyExtractor = useCallback((item: ChannelVideoModel) => item.videoId, []);

  // 아이템 분리자
  const renderItemSeparator = useCallback(() => <Gap size={ITEM_SEPARATOR_HEIGHT} />, []);

  // 헤더 행 애니메이션 (스크롤 시 opacity만 변경 - GPU 처리)
  const headerRowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_ROW_HEIGHT * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // 스티키 헤더 애니메이션 (스크롤 시 위로 이동)
  const stickyHeaderTranslateStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_ROW_HEIGHT],
      [0, -HEADER_ROW_HEIGHT],
      Extrapolation.CLAMP,
    );
    // marginBottom을 음수로 줘서 하단 빈 공간 방지
    const marginBottom = interpolate(
      scrollY.value,
      [0, HEADER_ROW_HEIGHT],
      [0, -HEADER_ROW_HEIGHT],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }],
      marginBottom,
    };
  });

  // 스티키 채널 선택기 높이 애니메이션
  const channelSelectorStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, CHANNEL_SELECTOR_SCROLL_RANGE],
      [CHANNEL_SELECTOR_HEIGHT_MAX, CHANNEL_SELECTOR_HEIGHT_MIN],
      Extrapolation.CLAMP,
    );
    return {
      height,
    };
  });

  // 빈 상태
  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <ActivityIndicator color={colors.gray02} />
        </LoadingContainer>
      );
    }
    return (
      <EmptyContainer>
        <EmptyText>영상이 없습니다</EmptyText>
        <EmptySubText>다른 채널을 선택해보세요</EmptySubText>
      </EmptyContainer>
    );
  }, [isLoading]);

  // 리스트 푸터 (로딩)
  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <FooterContainer>
        <ActivityIndicator color={colors.gray02} />
      </FooterContainer>
    );
  }, [isFetchingNextPage]);

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <Container style={{ paddingTop: insets.top }}>
        {/* 헤더 행: 스크롤 시 사라짐 */}
        <Animated.View style={[{ height: HEADER_ROW_HEIGHT }, headerRowStyle]}>
          <HeaderRow>
            <HeaderTitle>채널</HeaderTitle>
            <MoreChip onPress={handleViewAllChannels} activeOpacity={0.8}>
              <MoreChipText>더보기</MoreChipText>
            </MoreChip>
          </HeaderRow>
        </Animated.View>

        {/* 스티키 + 리스트 영역 (스크롤 시 함께 위로 이동) */}
        <Animated.View style={[{ flex: 1 }, stickyHeaderTranslateStyle]}>
          {/* 스티키 영역: 채널 선택기 + 필터 바 */}
          <StickyHeader>
            <Animated.View style={channelSelectorStyle}>
              <AnimatedChannelSelector
                channels={channels}
                selectedIds={selectedChannelIds}
                onSelectionChange={handleChannelSelectionChange}
                isLoading={isChannelsLoading}
                scrollY={scrollY}
              />
            </Animated.View>
            <FilterRow>
              <SortSelector sortType={sortType} onSortChange={handleSortChange} />
            </FilterRow>
          </StickyHeader>

          {/* 비디오 리스트 */}
          <Animated.FlatList
            ref={listRef}
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderItemSeparator}
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={5}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />
        </Animated.View>
      </Container>
    </BasePage>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
  overflow: 'hidden',
});

const HeaderRow = styled.View({
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 16,
  paddingHorizontal: 16,
  overflow: 'hidden',
});

const HeaderTitle = styled.Text({
  ...textStyles.headline1,
  color: colors.white,
});

const MoreChip = styled(TouchableOpacity)({
  backgroundColor: colors.gray04,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
});

const MoreChipText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

const StickyHeader = styled.View({
  zIndex: 10,
  backgroundColor: colors.black,
});

const FilterRow = styled.View({
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  paddingHorizontal: 16,
  height: FILTER_BAR_HEIGHT,
});

const LoadingContainer = styled.View({
  paddingVertical: 60,
  alignItems: 'center',
});

const EmptyContainer = styled.View({
  paddingVertical: 60,
  alignItems: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.title2,
  color: colors.gray02,
});

const EmptySubText = styled.Text({
  ...textStyles.body3,
  color: colors.gray03,
  marginTop: 8,
});

const FooterContainer = styled.View({
  paddingVertical: 20,
  alignItems: 'center',
});
