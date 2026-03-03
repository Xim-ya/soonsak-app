/**
 * ChannelScreen - 채널 탭 화면
 *
 * 다양한 채널의 비디오를 탐색할 수 있는 화면입니다.
 * 상단에서 채널을 선택하고, 정렬 옵션을 변경하여 비디오를 필터링할 수 있습니다.
 * 스크롤 시 채널 선택 영역이 축소되며 상단에 고정됩니다.
 *
 * FlashList를 사용하여 FlatList 대비 5-10배 성능 향상을 제공합니다.
 *
 * 반응형 레이아웃:
 * - Phone (<600dp): 전체 너비 단일 열 카드 (ChannelVideoCard)
 * - Phablet/Tablet (>=600dp): YouTube 스타일 2열 그리드 (TabletVideoCard)
 */

import { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, TouchableOpacity, Dimensions, View } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useFrameCallback,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import FilterIcon from '@assets/icons/filter.svg';
import textStyles from '@/shared/styles/textStyles';
import { BasePage } from '@/presentation/components/page/BasePage';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { LoginPromptDialog } from '@/presentation/components/dialog/LoginPromptDialog';
import { ContentFilterBottomSheet } from '@/presentation/components/filter/ContentFilterBottomSheet';
import { AppSize } from '@/shared/utils/appSize';
import { CHANNEL_SORT_OPTIONS, type ChannelVideoModel, type ChannelItemModel } from './_types';
import { useChannelList } from './_hooks/useChannelList';
import { useChannelVideos } from './_hooks/useChannelVideos';
import {
  AnimatedChannelSelector,
  CHANNEL_SELECTOR_HEIGHT_MAX,
  CHANNEL_SELECTOR_HEIGHT_MIN,
  CHANNEL_SELECTOR_SCROLL_RANGE,
} from './_components/AnimatedChannelSelector';
import { ChannelVideoCard, calculateCardHeight } from './_components/ChannelVideoCard';
import { TabletVideoCard } from './_components/TabletVideoCard';
import { SortSelector } from '@/presentation/components/sort';
import { ChannelProvider, useChannel } from './_provider/ChannelProvider';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FILTER_BAR_HEIGHT = 44;
const HEADER_ROW_HEIGHT = 56;
const FOOTER_HEIGHT = 60;

// 태블릿 그리드 레이아웃 상수
const GRID_COLUMNS = 2;
const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMN_GAP = 12;

// iOS 스크롤 jitter 방지: exponential smoothing factor (0.15-0.25 권장)
const SMOOTHING_FACTOR = 0.18;

// 그라데이션 opacity 애니메이션 범위 (스크롤에 따라 나타남)
const GRADIENT_OPACITY_START = 30;
const GRADIENT_OPACITY_END = 60;

// Android gradient 위치 보정
const ANDROID_GRADIENT_STYLE = Platform.OS === 'android' ? { bottom: -19 } : undefined;

// Reanimated와 호환되는 AnimatedFlashList 생성 (타입 단언으로 호환성 확보)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList) as any;

// 스타일 상수
const headerRowWrapperStyle = { height: HEADER_ROW_HEIGHT };
const stickyContentStyle = { flex: 1 } as const;
const phoneCardContainerStyle = { marginBottom: 32 } as const;

/**
 * ChannelScreen - 채널 탭 화면 (Provider 래퍼)
 */
export default function ChannelScreen() {
  return (
    <ChannelProvider>
      <ChannelContent />
    </ChannelProvider>
  );
}

/**
 * ChannelContent - 실제 채널 탭 화면 내용
 *
 * ChannelProvider 내부에서 렌더링되어 채널 컨텍스트에 접근 가능
 */
function ChannelContent() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // Context에서 상태 가져오기
  const {
    filter,
    sheetFilter,
    hasPendingFilter,
    isCustomFilterActive,
    isFilterSheetVisible,
    openSheet,
    closeSheet,
    applyFilter,
    requestChannelSelection,
    isLoginDialogVisible,
    loginSuccessCallback,
    closeLoginDialog,
    sortType,
    handleSortChange,
  } = useChannel();

  // 대형 화면 여부 (phablet/tablet)
  const isLargeScreen = AppSize.isLargeScreen();

  // 화면 너비 (FlashList estimatedItemSize 계산용)
  const screenWidth = AppSize.actualScreenWidth || Dimensions.get('window').width;

  // 태블릿 그리드 카드 너비 계산 (actualScreenWidth 사용)
  // 의도적 빈 의존성: 태블릿 모드에서 화면 너비는 앱 시작 시 결정되며 런타임 중 변경되지 않음
  const tabletCardWidth = useMemo(() => {
    return (screenWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_COLUMN_GAP) / GRID_COLUMNS;
  }, [screenWidth]);

  // FlashList 성능 최적화: 예상 아이템 크기 (스크롤 성능에 중요)
  // 폰: 카드 높이 + 하단 마진 32px
  // 태블릿: 카드 높이 + 하단 마진 24px (그리드이므로 행 단위)
  const estimatedItemSize = useMemo(() => {
    if (isLargeScreen) {
      // 태블릿: 그리드 카드 높이 (tabletCardWidth 기반)
      const tabletCardHeight = tabletCardWidth * (9 / 16) + 12 + 64; // 썸네일 + gap + info
      return tabletCardHeight + 24; // + marginBottom
    }
    // 폰: 전체 너비 카드
    return calculateCardHeight(screenWidth) + 32; // + marginBottom
  }, [isLargeScreen, screenWidth, tabletCardWidth]);

  // 스크롤 값 추적
  const scrollY = useSharedValue(0);
  const smoothedScrollY = useSharedValue(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null);

  // iOS 스크롤 jitter 방지: 매 프레임마다 exponential smoothing 적용
  useFrameCallback(() => {
    'worklet';
    const target = scrollY.value;
    const current = smoothedScrollY.value;
    const diff = target - current;

    // 차이가 0.5px 미만이면 목표값으로 스냅 (무한 접근 방지)
    if (Math.abs(diff) < 0.5) {
      smoothedScrollY.value = target;
    } else {
      smoothedScrollY.value = current + diff * SMOOTHING_FACTOR;
    }
  });

  // 채널 목록 조회
  const { channels, isLoading: isChannelsLoading } = useChannelList();

  // 비디오 목록 조회 (filter 전체를 전달하여 모든 필터 조건 적용)
  const { videos, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useChannelVideos(
    sortType,
    filter,
  );

  // 스크롤 핸들러 (스냅 없이 순수 스크롤 위치만 추적)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 비디오 클릭 핸들러 -> 콘텐츠 상세 페이지로 이동
  const handleVideoPress = useCallback(
    (video: ChannelVideoModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: video.contentId,
        type: video.contentType,
        title: video.contentTitle,
        videoId: video.videoId,
      });
    },
    [navigation],
  );

  // 더보기(전체 채널) 핸들러
  const handleViewAllChannels = useCallback(() => {
    navigation.navigate(routePages.channelAll);
  }, [navigation]);

  // 채널 클릭 핸들러 -> 채널 상세 페이지로 이동
  const handleChannelPress = useCallback(
    (channel: ChannelItemModel) => {
      const params: RootStackParamList[typeof routePages.channelDetail] = {
        channelId: channel.id,
      };
      if (channel.name) params.channelName = channel.name;
      if (channel.logoUrl) params.channelLogoUrl = channel.logoUrl;
      if (channel.subscriberCount) params.subscriberCount = channel.subscriberCount;

      navigation.navigate(routePages.channelDetail, params);
    },
    [navigation],
  );

  // 비디오 카드 내 채널 로고 클릭 핸들러 -> 채널 상세 페이지로 이동
  const handleVideoChannelPress = useCallback(
    (video: ChannelVideoModel) => {
      navigation.navigate(routePages.channelDetail, {
        channelId: video.channelId,
        channelName: video.channelName,
        channelLogoUrl: video.channelLogoUrl,
      });
    },
    [navigation],
  );

  // 무한 스크롤 핸들러
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 비디오 아이템 렌더 (폰: 전체 너비 카드, 태블릿: 그리드 카드)
  const renderVideoItem: ListRenderItem<ChannelVideoModel> = useCallback(
    ({ item, index }) => {
      if (isLargeScreen) {
        // 태블릿: 2열 그리드 (짝수 인덱스 왼쪽, 홀수 인덱스 오른쪽)
        const isLeftColumn = index % GRID_COLUMNS === 0;
        return (
          <View style={{ marginLeft: isLeftColumn ? 0 : GRID_COLUMN_GAP, marginBottom: 24 }}>
            <TabletVideoCard
              video={item}
              onPress={handleVideoPress}
              onChannelPress={handleVideoChannelPress}
              cardWidth={tabletCardWidth}
            />
          </View>
        );
      }
      // 폰: 전체 너비 카드 (아이템 간 32px 간격)
      return (
        <View style={phoneCardContainerStyle}>
          <ChannelVideoCard
            video={item}
            onPress={handleVideoPress}
            onChannelPress={handleVideoChannelPress}
          />
        </View>
      );
    },
    [handleVideoPress, handleVideoChannelPress, isLargeScreen, tabletCardWidth],
  );

  // 아이템 키 추출
  const keyExtractor = useCallback((item: ChannelVideoModel) => item.videoId, []);

  // 스타일 (insets는 앱 실행 중 거의 변하지 않아 useMemo 오버헤드가 더 큼)
  const containerStyle = { paddingTop: insets.top };
  const listContentStyle = isLargeScreen
    ? { paddingBottom: insets.bottom + 20, paddingHorizontal: GRID_HORIZONTAL_PADDING }
    : { paddingBottom: insets.bottom + 20 };

  // 헤더 행 애니메이션 (스크롤 시 opacity만 변경 - GPU 처리)
  const headerRowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      smoothedScrollY.value,
      [0, HEADER_ROW_HEIGHT * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // 스티키 헤더 애니메이션 (스크롤 시 위로 이동)
  const stickyHeaderTranslateStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      smoothedScrollY.value,
      [0, HEADER_ROW_HEIGHT],
      [0, -HEADER_ROW_HEIGHT],
      Extrapolation.CLAMP,
    );
    // marginBottom을 음수로 줘서 하단 빈 공간 방지
    const marginBottom = interpolate(
      smoothedScrollY.value,
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
      smoothedScrollY.value,
      [0, CHANNEL_SELECTOR_SCROLL_RANGE],
      [CHANNEL_SELECTOR_HEIGHT_MAX, CHANNEL_SELECTOR_HEIGHT_MIN],
      Extrapolation.CLAMP,
    );
    return {
      height,
    };
  });

  // 스티키 헤더 하단 패딩 애니메이션 (스크롤 시 줄어듦)
  const stickyHeaderPaddingStyle = useAnimatedStyle(() => {
    const paddingBottom = interpolate(
      smoothedScrollY.value,
      [0, CHANNEL_SELECTOR_SCROLL_RANGE],
      [16, 0],
      Extrapolation.CLAMP,
    );
    return {
      paddingBottom,
    };
  });

  // 필터 행 상단 마진 애니메이션 (스크롤 시 줄어듦)
  const filterRowStyle = useAnimatedStyle(() => {
    const marginTop = interpolate(
      smoothedScrollY.value,
      [0, CHANNEL_SELECTOR_SCROLL_RANGE],
      [8, 0],
      Extrapolation.CLAMP,
    );
    return {
      marginTop,
    };
  });

  // 하단 그라데이션 opacity 애니메이션 (스크롤 시 나타남)
  const gradientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      smoothedScrollY.value,
      [GRADIENT_OPACITY_START, GRADIENT_OPACITY_END],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
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

  // 리스트 푸터 (로딩) - 높이 고정으로 스크롤 점프 방지
  const renderListFooter = useCallback(() => {
    return (
      <FooterContainer>
        {isFetchingNextPage && <ActivityIndicator color={colors.gray02} />}
      </FooterContainer>
    );
  }, [isFetchingNextPage]);

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      {/* 필터 바텀시트 */}
      <ContentFilterBottomSheet
        visible={isFilterSheetVisible}
        currentFilter={sheetFilter}
        onApply={applyFilter}
        onClose={closeSheet}
        onRequestChannelSelection={requestChannelSelection}
        preserveScrollPosition={hasPendingFilter}
      />

      {/* 로그인 유도 다이얼로그 */}
      <LoginPromptDialog
        visible={isLoginDialogVisible}
        onClose={closeLoginDialog}
        onLoginSuccess={loginSuccessCallback}
      />
      <Container style={containerStyle}>
        {/* 헤더 행: 스크롤 시 사라짐 */}
        <Animated.View style={[headerRowWrapperStyle, headerRowStyle]}>
          <HeaderRow>
            <HeaderTitle>채널</HeaderTitle>
            <MoreChip onPress={handleViewAllChannels} activeOpacity={0.8}>
              <MoreChipText>더보기</MoreChipText>
            </MoreChip>
          </HeaderRow>
        </Animated.View>

        {/* 스티키 + 리스트 영역 (스크롤 시 함께 위로 이동) */}
        <Animated.View style={[stickyContentStyle, stickyHeaderTranslateStyle]}>
          {/* 스티키 영역: 채널 선택기 + 필터 바 */}
          <StickyHeader style={stickyHeaderPaddingStyle}>
            <Animated.View style={channelSelectorStyle}>
              <AnimatedChannelSelector
                channels={channels}
                onChannelPress={handleChannelPress}
                isLoading={isChannelsLoading}
                scrollY={smoothedScrollY}
              />
            </Animated.View>
            <FilterRow style={filterRowStyle}>
              <FilterIconButton onPress={openSheet} activeOpacity={0.7}>
                <FilterIcon width={16} height={16} color={colors.white} />
                {isCustomFilterActive && <ActiveBadge />}
              </FilterIconButton>
              <SortSelector
                sortType={sortType}
                onSortChange={handleSortChange}
                options={CHANNEL_SORT_OPTIONS}
              />
            </FilterRow>
            {/* 하단 그라데이션 - 스크롤에 따라 opacity 변화 */}
            <GradientWrapper style={[gradientStyle, ANDROID_GRADIENT_STYLE]} pointerEvents="none">
              <BottomGradient colors={['#000000', '#00000000']} />
            </GradientWrapper>
          </StickyHeader>

          {/* 비디오 리스트 - FlashList로 성능 5-10배 향상 */}
          <AnimatedFlashList
            ref={listRef}
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={listContentStyle}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            // 태블릿: 2열 그리드 (numColumns 변경 시 key로 리마운트 필요)
            numColumns={isLargeScreen ? GRID_COLUMNS : 1}
            key={isLargeScreen ? 'grid' : 'list'}
            // FlashList 성능 최적화
            estimatedItemSize={estimatedItemSize}
            drawDistance={estimatedItemSize * 2} // 2개 아이템 높이만큼 미리 렌더링
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

const StickyHeader = styled(Animated.View)({
  zIndex: 10,
  backgroundColor: colors.black,
  overflow: 'visible',
});

const FilterRow = styled(Animated.View)({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  height: FILTER_BAR_HEIGHT,
});

const FilterIconButton = styled.TouchableOpacity({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
});

const ActiveBadge = styled.View({
  position: 'absolute',
  top: 2,
  right: 2,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.main,
});

const GradientWrapper = styled(Animated.View)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: -20,
  height: 20,
});

const BottomGradient = styled(LinearGradient)({
  flex: 1,
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
  height: FOOTER_HEIGHT,
  justifyContent: 'center',
  alignItems: 'center',
});
