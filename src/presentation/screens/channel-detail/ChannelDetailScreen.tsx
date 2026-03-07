import { useCallback, useMemo } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { BasePage } from '../../components/page';
import { BackButtonAppBar } from '../../components/app-bar';
import { DarkedLinearShadow, LinearAlign } from '../../components/shadow/DarkedLinearShadow';
import { SortSelector } from '../../components/sort';
import { ViewModeToggle } from '../../components/view-mode';
import { LoginPromptDialog } from '../../components/dialog/LoginPromptDialog';
import { ScreenRouteProp } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { ChannelLogoImage } from '../../components/image/ChannelLogoImage';
import Gap from '../../components/view/Gap';
import { AppSize } from '@/presentation/utils/appSize';
import { CHANNEL_SORT_OPTIONS } from '../channel/_types';
import { useScrollAnimation } from './_hooks/useScrollAnimation';
import { useChannelFavoriteAction } from './_hooks/useChannelFavoriteAction';
import { VideoGridItem, VideoListItem } from './_components';
import { ChannelVideoModel } from './_types';
import { SkeletonView } from '../../components/loading/SkeletonView';
import { ChannelDetailProvider, useChannelDetail } from './_provider/ChannelDetailProvider';
import HeartBlankSvg from '@assets/icons/heart_blank.svg';
import HeartFilledSvg from '@assets/icons/heart_filled.svg';

type ChannelDetailRouteParams = ScreenRouteProp<typeof routePages.channelDetail>;

// 태블릿 레이아웃 상수
const TABLET_MAX_WIDTH = 500;
const isLargeScreen = AppSize.isLargeScreen();

// FlatList 자체 스타일 (태블릿에서 가운데 정렬)
const FLATLIST_STYLE = isLargeScreen
  ? { alignSelf: 'center' as const, width: TABLET_MAX_WIDTH }
  : undefined;

const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: 16,
};

const COLUMN_WRAPPER_STYLE = {
  gap: 9,
};

/**
 * ChannelDetailScreen - 채널 상세 화면
 *
 * ChannelDetailProvider로 감싸 하위 컴포넌트에서
 * useChannelDetail() 훅을 통해 상태에 접근할 수 있습니다.
 */
export default function ChannelDetailScreen() {
  const route = useRoute<ChannelDetailRouteParams>();
  const { channelId, channelName, channelLogoUrl, subscriberCount, source } = route.params;

  return (
    <ChannelDetailProvider
      channelId={channelId}
      channelName={channelName}
      channelLogoUrl={channelLogoUrl}
      subscriberCount={subscriberCount}
      source={source}
    >
      <ChannelDetailContent />
    </ChannelDetailProvider>
  );
}

/**
 * ChannelDetailContent - 실제 채널 상세 화면 내용
 *
 * ChannelDetailProvider 내부에서 렌더링되어 채널 컨텍스트에 접근 가능
 */
function ChannelDetailContent() {
  const insets = useSafeAreaInsets();

  // Provider에서 상태 가져오기
  const {
    channelId,
    sortType,
    setSortType,
    viewMode,
    setViewMode,
    displayName,
    displayLogoUrl,
    formattedSubscriberCount,
    isChannelLoading,
    videos,
    totalCount,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useChannelDetail();

  // 채널 찜 액션 관리
  const {
    isFavorited,
    isLoginDialogVisible,
    handleToggleFavorite,
    handleCloseDialog,
    loginSuccessCallback,
  } = useChannelFavoriteAction({ channelId, channelName: displayName });

  // 스크롤 애니메이션 관리
  const { handleScroll, gradientAnimatedStyle } = useScrollAnimation();

  const renderItem = useCallback(
    ({ item }: { readonly item: ChannelVideoModel }) => {
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
    [viewMode, setViewMode],
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
          <SubscriberRow>
            {formattedSubscriberCount && formattedSubscriberCount !== '0' && (
              <SubscriberText>구독자 {formattedSubscriberCount}명</SubscriberText>
            )}
            <FavoriteButton onPress={handleToggleFavorite} activeOpacity={0.7}>
              {isFavorited ? (
                <HeartFilledSvg width={12} height={12} />
              ) : (
                <HeartBlankSvg width={12} height={12} />
              )}
              <FavoriteButtonText>찜</FavoriteButtonText>
            </FavoriteButton>
          </SubscriberRow>
        )}
        <FilterRow>
          <ContentCountText>{totalCount}개의 콘텐츠</ContentCountText>
          <SortSelector
            sortType={sortType}
            onSortChange={setSortType}
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
    isFavorited,
    handleToggleFavorite,
    totalCount,
    sortType,
    setSortType,
  ]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isLoading, fetchNextPage]);

  const keyExtractor = useCallback(
    (item: ChannelVideoModel, index: number) => `${item.id}-${index}`,
    [],
  );

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
        style={FLATLIST_STYLE}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        columnWrapperStyle={viewMode === 'card' ? COLUMN_WRAPPER_STYLE : undefined}
        showsVerticalScrollIndicator={false}
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

      {/* 로그인 유도 다이얼로그 */}
      <LoginPromptDialog
        visible={isLoginDialogVisible}
        onClose={handleCloseDialog}
        onLoginSuccess={loginSuccessCallback}
      />
    </BasePage>
  );
}

/* Styled Components */

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

const SubscriberRow = styled.View({
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
});

const SubscriberText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

const FavoriteButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(40, 40, 49, 0.6)',
  borderRadius: 12,
  paddingVertical: 4,
  paddingHorizontal: 8,
  gap: 3,
});

const FavoriteButtonText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  marginRight: 3,
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
