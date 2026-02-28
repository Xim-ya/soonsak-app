import { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { BasePage } from '../../components/page';
import { BackButtonAppBar } from '../../components/app-bar';
import { DarkedLinearShadow, LinearAlign } from '../../components/shadow/DarkedLinearShadow';
import { SortSelector } from '../../components/sort';
import { ViewModeToggle, type ViewMode } from '../../components/view-mode';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { ChannelLogoImage } from '../../components/image/ChannelLogoImage';
import Gap from '../../components/view/Gap';
import { AppSize } from '@/shared/utils/appSize';
import type { SortType } from '@/shared/types/sort';
import { CHANNEL_SORT_OPTIONS } from '../channel/_types';
import { useChannelContents } from './_hooks/useChannelContents';
import { useChannelInfo } from './_hooks/useChannelInfo';
import { useScrollAnimation } from './_hooks/useScrollAnimation';
import { VideoGridItem, VideoListItem } from './_components';
import { ChannelVideoModel } from './_types';
import { SkeletonView } from '../../components/loading/SkeletonView';

type ChannelDetailRouteParams = ScreenRouteProp<typeof routePages.channelDetail>;

export default function ChannelDetailPage() {
  const route = useRoute<ChannelDetailRouteParams>();
  const { channelId, channelName, channelLogoUrl, subscriberCount } = route.params;
  const insets = useSafeAreaInsets();

  // 정렬 상태 (기본값: 최신순)
  const [sortType, setSortType] = useState<SortType>('latest');
  // 뷰 모드 상태 (기본값: 카드 뷰)
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // 채널 정보 관리
  const { displayName, displayLogoUrl, isChannelLoading, formattedSubscriberCount } =
    useChannelInfo({
      channelId,
      channelName,
      channelLogoUrl,
      subscriberCount,
    });

  // 채널 콘텐츠 관리 (정렬 타입 전달)
  const { videos, isLoading, fetchNextPage, hasNextPage, totalCount } = useChannelContents(
    channelId,
    sortType,
  );

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((newSortType: SortType) => {
    setSortType(newSortType);
  }, []);

  // 스크롤 애니메이션 관리
  const { handleScroll, gradientAnimatedStyle } = useScrollAnimation();

  const renderItem = useCallback(
    ({ item }: { item: ChannelVideoModel }) => {
      if (viewMode === 'list') {
        return <VideoListItem video={item} />;
      }
      return <VideoGridItem video={item} />;
    },
    [viewMode],
  );

  // 앱바 액션: 뷰 모드 토글
  const appBarActions = useMemo(
    () => [<ViewModeToggle key="view-toggle" mode={viewMode} onModeChange={setViewMode} />],
    [viewMode],
  );

  const renderHeader = useCallback(() => {
    return (
      <HeaderContainer>
        <Gap size={insets.top + 42} />
        <Gap size={4} />
        {isChannelLoading ? (
          <SkeletonView width={90} height={90} borderRadius={45} />
        ) : (
          <ChannelLogoImage source={displayLogoUrl} size={90} />
        )}
        <Gap size={8} />
        {isChannelLoading ? (
          <SkeletonView width={120} height={24} borderRadius={4} />
        ) : (
          <ChannelName numberOfLines={1}>{displayName}</ChannelName>
        )}
        <Gap size={4} />
        {isChannelLoading ? (
          <SkeletonView width={80} height={16} borderRadius={4} />
        ) : (
          formattedSubscriberCount &&
          formattedSubscriberCount !== '0' && (
            <SubscriberText>구독자 {formattedSubscriberCount}명</SubscriberText>
          )
        )}
        <FilterRow>
          <ContentCountText>{totalCount}개의 콘텐츠</ContentCountText>
          <SortSelector
            sortType={sortType}
            onSortChange={handleSortChange}
            options={CHANNEL_SORT_OPTIONS}
          />
        </FilterRow>
      </HeaderContainer>
    );
  }, [
    insets.top,
    isChannelLoading,
    displayLogoUrl,
    displayName,
    formattedSubscriberCount,
    totalCount,
    sortType,
    handleSortChange,
  ]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isLoading, fetchNextPage]);

  const keyExtractor = useCallback((item: ChannelVideoModel) => `${item.id}-${item.contentId}`, []);

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      {/* 상단 고정 그라데이션 (항상 보임 - status bar 영역 덮음) */}
      <FixedGradientContainer safeAreaHeight={insets.top} pointerEvents="none">
        <DarkedLinearShadow height={insets.top + 140} align={LinearAlign.topBottom} />
      </FixedGradientContainer>

      {/* 스크롤 시 나타나는 상단 그라데이션 */}
      <TopGradientContainer style={gradientAnimatedStyle} pointerEvents="none">
        <DarkedLinearShadow height={172} align={LinearAlign.topBottom} />
      </TopGradientContainer>

      <BottomGradientContainer pointerEvents="none">
        <DarkedLinearShadow height={156} align={LinearAlign.bottomTop} />
      </BottomGradientContainer>

      {/* 앱바 */}
      <AppBarContainer safeAreaTop={insets.top}>
        <BackButtonAppBar
          position="relative"
          backgroundColor="transparent"
          actions={appBarActions}
        />
      </AppBarContainer>

      <FlatList
        key={viewMode}
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'card' ? 3 : 1}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        columnWrapperStyle={viewMode === 'card' ? { gap: 9 } : undefined}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<Gap size={106} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </BasePage>
  );
}

// 항상 보이는 상단 그라데이션 (status bar 영역 덮음)
const FixedGradientContainer = styled.View<{ safeAreaHeight: number }>(({ safeAreaHeight }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: safeAreaHeight + 140,
  zIndex: 997,
}));

// 스크롤 시 나타나는 상단 그라데이션
const TopGradientContainer = styled(Animated.View)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 998,
});

const BottomGradientContainer = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 998,
});

const AppBarContainer = styled.View<{ safeAreaTop: number }>(({ safeAreaTop }) => ({
  position: 'absolute',
  top: safeAreaTop,
  left: 0,
  right: 0,
  zIndex: 999,
  height: 48,
}));

const HeaderContainer = styled.View({
  alignItems: 'center',
  width: '100%',
});

const ChannelName = styled.Text({
  ...textStyles.headline1,
  textAlign: 'center',
  maxWidth: AppSize.screenWidth - 32,
});

const SubscriberText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

const FilterRow = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  paddingTop: 16,
  paddingBottom: 16,
});

const ContentCountText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});
