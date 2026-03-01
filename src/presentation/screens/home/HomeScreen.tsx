import { useCallback, useRef, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import colors from '../../../shared/styles/colors';
import { Header } from './_components/Header';
import HomeAppBar from './_components/HomeAppBar';
import RecentContentView from './_components/RecentContentView';
import { TopTenContentListView } from './_components/TopTenContentListView';
import { FeaturedChannelSectionView } from './_components/FeaturedChannelSectionView';
import { LongRuntimeContentListView } from './_components/LongRuntimeContentListView';
import { ContentCollectionSectionView } from './_components/ContentCollectionSectionView';
import { WatchHistorySectionView, type WatchHistoryModelType } from '@/features/watch-history';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 뷰포트 진입 판단 여유값 (px) */
const VIEWPORT_THRESHOLD = 200;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [isCollectionVisible, setIsCollectionVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const collectionYRef = useRef(0);
  const scrollY = useSharedValue(0);
  const isTriggered = useSharedValue(false);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  const handleCollectionLayout = useCallback((event: LayoutChangeEvent) => {
    collectionYRef.current = event.nativeEvent.layout.y;
  }, []);

  const triggerCollectionLoad = useCallback(() => {
    setIsCollectionVisible(true);
  }, []);

  // 시청기록 아이템 클릭 핸들러 (콘텐츠 상세 페이지로 이동)
  const handleWatchHistoryItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      navigation.navigate(routePages.contentDetail, {
        id: item.contentId,
        type: item.contentType,
        title: item.contentTitle,
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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // 스크롤 위치 감지하여 레이지 로드 트리거 (stale closure 방지)
  useAnimatedReaction(
    () => scrollY.value,
    (currentScrollY) => {
      if (isTriggered.value) return;
      if (collectionYRef.current <= 0 || viewportHeight <= 0) return;

      const triggerPoint = collectionYRef.current - viewportHeight - VIEWPORT_THRESHOLD;
      if (currentScrollY >= triggerPoint) {
        isTriggered.value = true;
        runOnJS(triggerCollectionLoad)();
      }
    },
    [viewportHeight],
  );

  return (
    <Container onLayout={handleContainerLayout}>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <Header scrollY={scrollY} />
        <WatchHistorySectionView
          title="시청 중인 콘텐츠"
          onItemPress={handleWatchHistoryItemPress}
        />
        <RecentContentView />
        <TopTenContentListView />
        <FeaturedChannelSectionView />
        <View onLayout={handleCollectionLayout}>
          <ContentCollectionSectionView isVisible={isCollectionVisible} />
        </View>
        <LongRuntimeContentListView />
      </Animated.ScrollView>
      <HomeAppBar scrollY={scrollY} />
    </Container>
  );
}

const Container = styled.View({
  backgroundColor: colors.black,
  flex: 1,
});
