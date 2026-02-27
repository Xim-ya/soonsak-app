import { useCallback } from 'react';
import { FlatList } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { BasePage } from '../../components/page';
import { BackButtonAppBar } from '../../components/app-bar';
import { DarkedLinearShadow, LinearAlign } from '../../components/shadow/DarkedLinearShadow';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { ChannelLogoImage } from '../../components/image/ChannelLogoImage';
import Gap from '../../components/view/Gap';
import { AppSize } from '@/shared/utils/appSize';
import { useChannelContents } from './_hooks/useChannelContents';
import { useChannelInfo } from './_hooks/useChannelInfo';
import { useScrollAnimation } from './_hooks/useScrollAnimation';
import { VideoGridItem } from './_components/VideoGridItem';
import { ChannelVideoModel } from './_types';
import { SkeletonView } from '../../components/loading/SkeletonView';

type ChannelDetailRouteParams = ScreenRouteProp<typeof routePages.channelDetail>;

export default function ChannelDetailPage() {
  const route = useRoute<ChannelDetailRouteParams>();
  const { channelId, channelName, channelLogoUrl, subscriberCount } = route.params;
  const insets = useSafeAreaInsets();

  // 채널 정보 관리
  const { displayName, displayLogoUrl, isChannelLoading, formattedSubscriberCount } =
    useChannelInfo({
      channelId,
      channelName,
      channelLogoUrl,
      subscriberCount,
    });

  // 채널 콘텐츠 관리
  const { videos, isLoading, fetchNextPage, hasNextPage, totalCount } =
    useChannelContents(channelId);

  // 스크롤 애니메이션 관리
  const { handleScroll, gradientAnimatedStyle } = useScrollAnimation();

  const renderItem = useCallback(
    ({ item }: { item: ChannelVideoModel }) => <VideoGridItem video={item} />,
    [],
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
        <ContentCountWrapper>
          <ContentCountText>{totalCount}개의 콘텐츠</ContentCountText>
        </ContentCountWrapper>
      </HeaderContainer>
    );
  }, [
    insets.top,
    isChannelLoading,
    displayLogoUrl,
    displayName,
    formattedSubscriberCount,
    totalCount,
  ]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isLoading, fetchNextPage]);

  const keyExtractor = useCallback((item: ChannelVideoModel) => item.id, []);

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
        <BackButtonAppBar position="relative" backgroundColor="transparent" />
      </AppBarContainer>

      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        columnWrapperStyle={{ gap: 9 }}
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

const ContentCountWrapper = styled.View({
  paddingTop: 16,
  paddingBottom: 8,
  alignSelf: 'flex-end',
});

const ContentCountText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});
