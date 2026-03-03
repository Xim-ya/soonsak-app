import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import styled from '@emotion/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { AppSize } from '@/shared/utils/appSize';
import { analyticsService } from '@/shared/analytics';
import type { UserContentItem } from '../_types';
import { RatingOverlay } from './RatingOverlay';

interface ContentGridItemProps {
  readonly item: UserContentItem;
  readonly showRating?: boolean;
}

// 3열 그리드 상수 (재사용을 위해 export)
export const GRID_ITEM_WIDTH = (AppSize.screenWidth - 32 - 18) / 3;
export const GRID_POSTER_HEIGHT = GRID_ITEM_WIDTH * 1.5;
export const GRID_COLUMN_GAP = 9;

/**
 * ContentGridItem - 사용자 콘텐츠 그리드 아이템 컴포넌트
 *
 * 찜/평가/시청완료 목록에서 3열 그리드로 표시되는 콘텐츠 아이템입니다.
 * 포스터 이미지를 표시하며, 클릭 시 해당 콘텐츠 상세 페이지로 이동합니다.
 * ratings 탭에서는 별점 오버레이를 추가로 표시합니다.
 */
function ContentGridItem({ item, showRating = false }: ContentGridItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const posterUrl = formatter.prefixTmdbImgUrl(item.contentPosterPath, {
    size: TmdbImageSize.w342,
  });

  // initialData로 포스터 경로를 전달하여 API 응답 전에 즉시 표시
  const handlePress = useCallback(() => {
    // 콜렉션 콘텐츠 클릭 이벤트 로깅
    analyticsService.myCollectionContentClick({
      content_id: item.contentId,
      content_type: item.contentType,
      rating: item.rating ?? undefined,
    });

    navigation.push(routePages.contentDetail, {
      id: item.contentId,
      title: item.contentTitle,
      type: item.contentType,
      initialData: {
        posterPath: item.contentPosterPath,
      },
    });
  }, [
    navigation,
    item.contentId,
    item.contentTitle,
    item.contentType,
    item.contentPosterPath,
    item.rating,
  ]);

  return (
    <Container>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <PosterWrapper>
          <LoadableImageView
            source={posterUrl}
            width={GRID_ITEM_WIDTH}
            height={GRID_POSTER_HEIGHT}
            borderRadius={4}
          />
          {showRating && item.rating != null && <RatingOverlay rating={item.rating} />}
        </PosterWrapper>
      </TouchableOpacity>
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  width: GRID_ITEM_WIDTH,
  marginBottom: 12,
});

const PosterWrapper = styled.View({
  position: 'relative',
});

export const MemoizedContentGridItem = React.memo(ContentGridItem);
