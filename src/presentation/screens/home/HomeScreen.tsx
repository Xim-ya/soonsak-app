import { useCallback } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import Animated from 'react-native-reanimated';
import colors from '@/shared/styles/colors';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentSource, analyticsService } from '@/shared/analytics';
import { WatchHistorySectionView, type WatchHistoryModelType } from '@/features/watch-history';
import Gap from '@/presentation/components/view/Gap';
import { Header } from './_components/Header';
import HomeAppBar from './_components/HomeAppBar';
import RecentContentView from './_components/RecentContentView';
import { TopTenContentListView } from './_components/TopTenContentListView';
import { FeaturedChannelSectionView } from './_components/FeaturedChannelSectionView';
import { LongRuntimeContentListView } from './_components/LongRuntimeContentListView';
import { ContentCollectionSectionView } from './_components/ContentCollectionSectionView';
import { useScrollLazyLoad } from './_hooks/useScrollLazyLoad';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * HomeScreen - 홈 탭 화면
 *
 * 다양한 콘텐츠 섹션을 표시하는 메인 홈 화면입니다.
 * 스크롤 시 레이지 로드를 통해 하단 콘텐츠 컬렉션을 지연 로드합니다.
 */
export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const {
    scrollHandler,
    scrollY,
    isVisible: isCollectionVisible,
    handleContainerLayout,
    handleTargetLayout,
  } = useScrollLazyLoad();

  // 리뷰 퍼널 테스트 버튼 핸들러
  const handleReviewFunnelTest = useCallback(() => {
    navigation.navigate(routePages.reviewFunnel);
  }, [navigation]);

  // 시청기록 아이템 클릭 핸들러
  const handleWatchHistoryItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      // 홈 섹션 콘텐츠 클릭 이벤트 로깅
      analyticsService.homeSectionClick({
        section_type: 'watch_history',
        content_id: item.contentId,
        content_type: item.contentType,
        position: 0, // 홈에서는 단일 아이템이므로 position 0
      });

      navigation.navigate(routePages.contentDetail, {
        id: item.contentId,
        type: item.contentType,
        title: item.contentTitle,
        source: ContentSource.HOME_WATCH_HISTORY,
        initialData: {
          backdropPath: item.contentBackdropPath,
          posterPath: item.contentPosterPath,
          progressSeconds: item.progressSeconds,
          durationSeconds: item.durationSeconds,
        },
      });
    },
    [navigation],
  );

  return (
    <Container onLayout={handleContainerLayout}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Header scrollY={scrollY} />
        {/* TODO: 테스트용 리뷰 퍼널 버튼 - 배포 전 제거 */}
        <TestButtonContainer>
          <TestButton onPress={handleReviewFunnelTest} activeOpacity={0.8}>
            <TestButtonText>리뷰 퍼널 테스트</TestButtonText>
          </TestButton>
        </TestButtonContainer>
        <WatchHistorySectionView
          title="시청 중인 콘텐츠"
          onItemPress={handleWatchHistoryItemPress}
        />
        <RecentContentView />
        <TopTenContentListView />
        <FeaturedChannelSectionView />
        <View onLayout={handleTargetLayout}>
          <ContentCollectionSectionView isVisible={isCollectionVisible} />
        </View>
        <LongRuntimeContentListView />
        <Gap size={120} />
      </Animated.ScrollView>
      <HomeAppBar scrollY={scrollY} />
    </Container>
  );
}

const Container = styled.View({
  backgroundColor: colors.black,
  flex: 1,
});

// TODO: 테스트용 - 배포 전 제거
const TestButtonContainer = styled.View({
  paddingHorizontal: 16,
  paddingVertical: 12,
});

const TestButton = styled.TouchableOpacity({
  backgroundColor: colors.main,
  paddingVertical: 14,
  borderRadius: 10,
  alignItems: 'center',
});

const TestButtonText = styled.Text({
  color: colors.black,
  fontSize: 15,
  fontWeight: '700',
});
