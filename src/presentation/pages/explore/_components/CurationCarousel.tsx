/**
 * CurationCarousel - 큐레이션 캐러셀 컴포넌트
 *
 * 랜덤으로 선정된 콘텐츠의 대표 비디오를 가로 스크롤로 보여줍니다.
 * 터치 시 콘텐츠 상세 페이지로 이동합니다.
 *
 * @example
 * <CurationCarousel />
 */

import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import Gap from '@/presentation/components/view/Gap';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useCurationVideos } from '../_hooks/useCurationVideos';
import { CurationVideoItem, THUMBNAIL_WIDTH, ITEM_HEIGHT } from './CurationVideoItem';
import type { CurationVideoModel } from '../_types/exploreTypes';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 스냅 간격: 아이템 너비 + 간격
const ITEM_GAP = 12;
const SNAP_INTERVAL = THUMBNAIL_WIDTH + ITEM_GAP;

/** 아이템 간격 컴포넌트 (렌더링 최적화) */
const ItemSeparator = React.memo(() => <Gap size={ITEM_GAP} />);
ItemSeparator.displayName = 'CurationItemSeparator';

function CurationCarousel() {
  const navigation = useNavigation<NavigationProp>();
  const { videos, isLoading, error } = useCurationVideos();

  const handleVideoPress = useCallback(
    (video: CurationVideoModel) => {
      navigation.navigate(routePages.contentDetail, {
        id: video.contentId,
        title: video.contentTitle,
        type: video.contentType,
        videoId: video.videoId,
      });
    },
    [navigation],
  );

  // renderItem 메모이제이션
  const renderItem = useCallback(
    ({ item }: { item: CurationVideoModel }) => (
      <CurationVideoItem video={item} onPress={handleVideoPress} />
    ),
    [handleVideoPress],
  );

  // keyExtractor 메모이제이션
  const keyExtractor = useCallback((item: CurationVideoModel) => item.videoId, []);

  // getItemLayout - 스크롤 성능 최적화
  const getItemLayout = useCallback(
    (_: ArrayLike<CurationVideoModel> | null | undefined, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

  // 로딩 중 스켈레톤 표시
  if (isLoading) {
    return (
      <LoadingContainer>
        <SkeletonItem />
        <Gap size={ITEM_GAP} />
        <SkeletonItem />
      </LoadingContainer>
    );
  }

  // 에러 또는 데이터 없음 시 빈 컨테이너 (높이 유지로 레이아웃 점프 방지)
  if (error || videos.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
    <Container>
      <VideoList
        horizontal
        data={videos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={3}
        initialNumToRender={3}
      />
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  backgroundColor: colors.black,
});

const VideoList = styled(FlatList<CurationVideoModel>)({
  paddingHorizontal: 16,
});

const LoadingContainer = styled.View({
  flexDirection: 'row',
  paddingHorizontal: 16,
});

const SkeletonItem = styled.View({
  width: THUMBNAIL_WIDTH,
  height: ITEM_HEIGHT,
  backgroundColor: colors.gray05,
  borderRadius: 8,
});

const EmptyPlaceholder = styled.View({
  height: ITEM_HEIGHT,
});

export { CurationCarousel };
