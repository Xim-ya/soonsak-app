/**
 * CurationCarousel - 큐레이션 캐러셀 컴포넌트
 *
 * 로그인 사용자: 개인화 추천 콘텐츠의 대표 비디오
 * 비로그인 사용자: 랜덤 큐레이션 비디오
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
import { usePersonalizedCurationVideos } from '@/features/recommendations';
import { useCurationVideos } from '../_hooks/useCurationVideos';
import {
  CurationVideoItem,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  INFO_SECTION_HEIGHT,
  ITEM_HEIGHT,
} from './CurationVideoItem';
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

  // 개인화 추천 비디오 (로그인 시 사용)
  const {
    data: personalizedVideos,
    isLoading: isPersonalizedLoading,
    error: personalizedError,
  } = usePersonalizedCurationVideos(10);

  // 기본 큐레이션 비디오 (개인화 데이터 없을 때 폴백)
  const {
    videos: defaultVideos,
    isLoading: isDefaultLoading,
    error: defaultError,
  } = useCurationVideos();

  // 개인화 로딩 중이거나 데이터가 있으면 개인화 브랜치 사용
  // 로딩 중에도 개인화 상태를 유지하여 로딩 UI를 올바르게 표시
  const isUsingPersonalized =
    isPersonalizedLoading || (personalizedVideos && personalizedVideos.length > 0);
  const videos = isUsingPersonalized ? personalizedVideos ?? [] : defaultVideos;
  const isLoading = isUsingPersonalized ? isPersonalizedLoading : isDefaultLoading;
  const error = isUsingPersonalized ? personalizedError : defaultError;

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

/**
 * 스켈레톤 레이아웃 (CurationVideoItem과 동일하게 맞춤)
 *
 * VideoTitle: body2 (fontSize 15, lineHeight 22) × 2줄 = 44px
 * MetaInfo: alert2 (fontSize 13, lineHeight 16), marginTop 2
 * INFO_SECTION_HEIGHT = 44 + 2 + 16 = 62px
 *
 * 스켈레톤 바는 lineHeight 내에서 텍스트 baseline에 맞추기 위해
 * marginTop을 추가하여 아래로 내림 (총 높이는 유지)
 */
const TITLE_SKELETON_HEIGHT = 15; // body2 fontSize
const TITLE_LINE_HEIGHT = 22; // body2 lineHeight
const TITLE_TOP_OFFSET = 4; // baseline 정렬을 위한 상단 오프셋
const META_SKELETON_HEIGHT = 13; // alert2 fontSize
const META_MARGIN_TOP = 2; // MetaInfo marginTop

/** 썸네일 스켈레톤 */
const ThumbnailSkeleton = styled.View({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
  backgroundColor: colors.gray05,
  borderRadius: 12,
});

/** 정보 영역 스켈레톤 컨테이너 */
const InfoSkeletonContainer = styled.View({
  marginTop: 8,
  height: INFO_SECTION_HEIGHT,
});

/** 타이틀 스켈레톤 첫 번째 줄 */
const TitleSkeletonLine1 = styled.View({
  width: THUMBNAIL_WIDTH * 0.9,
  height: TITLE_SKELETON_HEIGHT,
  backgroundColor: colors.gray05,
  borderRadius: 4,
  marginTop: TITLE_TOP_OFFSET, // 첫 줄 baseline 정렬
  marginBottom: TITLE_LINE_HEIGHT - TITLE_SKELETON_HEIGHT - TITLE_TOP_OFFSET, // 22 - 15 - 4 = 3
});

/** 타이틀 스켈레톤 두 번째 줄 */
const TitleSkeletonLine2 = styled.View({
  width: THUMBNAIL_WIDTH * 0.6,
  height: TITLE_SKELETON_HEIGHT,
  backgroundColor: colors.gray05,
  borderRadius: 4,
  marginTop: 2,
  marginBottom: TITLE_LINE_HEIGHT - TITLE_SKELETON_HEIGHT - 2, // 22 - 15 - 2 = 5
});

/** 메타 스켈레톤 (제목 아래) */
const MetaSkeleton = styled.View({
  width: THUMBNAIL_WIDTH * 0.4,
  height: META_SKELETON_HEIGHT,
  backgroundColor: colors.gray05,
  borderRadius: 4,
  marginTop: META_MARGIN_TOP + TITLE_TOP_OFFSET - 1, // 2 + 4 - 1 = 5 (baseline 정렬)
});

/** 스켈레톤 아이템 컨테이너 */
const SkeletonItem = () => (
  <SkeletonItemContainer>
    <ThumbnailSkeleton />
    <InfoSkeletonContainer>
      <TitleSkeletonLine1 />
      <TitleSkeletonLine2 />
      <MetaSkeleton />
    </InfoSkeletonContainer>
  </SkeletonItemContainer>
);

const SkeletonItemContainer = styled.View({
  width: THUMBNAIL_WIDTH,
  height: ITEM_HEIGHT,
});

const EmptyPlaceholder = styled.View({
  height: ITEM_HEIGHT,
});

export { CurationCarousel };
