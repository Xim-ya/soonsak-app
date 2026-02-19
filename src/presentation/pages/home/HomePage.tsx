import { useCallback, useRef, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import styled from '@emotion/native';
import colors from '../../../shared/styles/colors';
import { Header } from './_components/Header';
import RecentContentView from './_components/RecentContentView';
import { TopTenContentListView } from './_components/TopTenContentListView';
import { FeaturedChannelSectionView } from './_components/FeaturedChannelSectionView';
import { LongRuntimeContentListView } from './_components/LongRuntimeContentListView';
import { ContentCollectionSectionView } from './_components/ContentCollectionSectionView';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';

/** 뷰포트 진입 판단 여유값 (px) */
const VIEWPORT_THRESHOLD = 200;

export default function HomeScreen() {
  const [isCollectionVisible, setIsCollectionVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const collectionYRef = useRef(0);
  const scrollY = useSharedValue(0);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  const handleCollectionLayout = useCallback((event: LayoutChangeEvent) => {
    collectionYRef.current = event.nativeEvent.layout.y;
  }, []);

  const checkCollectionVisibility = useCallback(
    (offsetY: number) => {
      if (isCollectionVisible) return;

      const triggerPoint = collectionYRef.current - viewportHeight - VIEWPORT_THRESHOLD;
      if (offsetY >= triggerPoint && collectionYRef.current > 0) {
        setIsCollectionVisible(true);
      }
    },
    [isCollectionVisible, viewportHeight],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(checkCollectionVisibility)(event.contentOffset.y);
    },
  });

  return (
    <Container onLayout={handleContainerLayout}>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <Header scrollY={scrollY} />
        <RecentContentView />
        <TopTenContentListView />
        <FeaturedChannelSectionView />
        <LongRuntimeContentListView />
        <View onLayout={handleCollectionLayout}>
          <ContentCollectionSectionView isVisible={isCollectionVisible} />
        </View>
      </Animated.ScrollView>
    </Container>
  );
}

const Container = styled.View({
  backgroundColor: colors.black,
  flex: 1,
});
