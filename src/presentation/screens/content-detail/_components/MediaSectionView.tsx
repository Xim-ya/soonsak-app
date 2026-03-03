import React, { useMemo, useCallback } from 'react';
import { Pressable, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useContentImages } from '@/features/tmdb/hooks/useContentImages';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';
import { useContentDetail } from '../_hooks/useContentDetail';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { ImageGrid } from '@/presentation/components/image/ImageGrid';
import { analyticsService } from '@/shared/analytics';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { AppSize } from '@/shared/utils/appSize';
import textStyles from '@/shared/styles/textStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HORIZONTAL_PADDING = 16;
const IMAGE_GAP = 6;
const PREVIEW_COUNT = 5;
const TABLET_CONTENT_MAX_WIDTH = 800;

function MediaSectionViewComponent() {
  const { id, type } = useContentDetailRoute();
  const { data: contentInfo } = useContentDetail(Number(id), type);
  const navigation = useNavigation<NavigationProp>();

  const backdropPath = contentInfo?.backdropPath || '';
  const { data: images } = useContentImages(Number(id), type, backdropPath);

  // 태블릿에서는 max-width 기준, 모바일에서는 screenWidth 기준
  const isLargeScreen = AppSize.isLargeScreen();
  const baseWidth = isLargeScreen
    ? Math.min(AppSize.actualScreenWidth, TABLET_CONTENT_MAX_WIDTH)
    : AppSize.screenWidth;
  const containerWidth = baseWidth - HORIZONTAL_PADDING * 2;
  const gridItemWidth = (containerWidth - IMAGE_GAP) / 2;
  const heroImageHeight = containerWidth * (9 / 16);
  const gridItemHeight = gridItemWidth * (9 / 16);

  const heroImage = images[0];
  const gridImages = useMemo(() => images.slice(1, PREVIEW_COUNT), [images]);
  const showMoreButton = images.length > 1;

  const handleImagePress = useCallback(
    (index: number) => {
      // GA4 content_detail_media_click 이벤트 로깅
      analyticsService.contentDetailMediaClick({
        content_id: Number(id),
        content_type: type,
        image_index: index,
      });
      navigation.navigate(routePages.imageDetail, {
        contentId: Number(id),
        contentType: type,
        backdropPath,
        initialIndex: index,
      });
    },
    [navigation, id, type, backdropPath],
  );

  const handleGridImagePress = useCallback(
    (index: number) => {
      handleImagePress(index);
    },
    [handleImagePress],
  );

  const handleMorePress = useCallback(() => {
    navigation.navigate(routePages.mediaList, {
      contentId: Number(id),
      contentType: type,
      backdropPath,
    });
  }, [navigation, id, type, backdropPath]);

  if (!heroImage) return null;

  return (
    <Container>
      {/* 타이틀 행: 스틸컷 + 오른쪽 화살표 */}
      <Pressable onPress={showMoreButton ? handleMorePress : undefined}>
        <TitleRow>
          <SectionTitle>스틸컷</SectionTitle>
          {showMoreButton && <RightArrowIcon style={{ width: 24, height: 24 }} />}
        </TitleRow>
      </Pressable>

      {/* 대형 이미지 (풀 너비, 16:9) */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleImagePress(0)}>
        <LoadableImageView
          source={formatter.prefixTmdbImgUrl(heroImage.filePath, { size: TmdbImageSize.w780 })}
          width={containerWidth}
          height={heroImageHeight}
          borderRadius={4}
        />
      </TouchableOpacity>

      {/* 2열 그리드 (나머지 이미지) */}
      {gridImages.length > 0 && (
        <GridWrapper>
          <ImageGrid
            images={gridImages}
            itemWidth={gridItemWidth}
            itemHeight={gridItemHeight}
            gap={IMAGE_GAP}
            onImagePress={handleGridImagePress}
            indexOffset={1}
          />
        </GridWrapper>
      )}
    </Container>
  );
}

const Container = styled.View({
  paddingHorizontal: HORIZONTAL_PADDING,
  paddingTop: 24,
  paddingBottom: 16,
});

const TitleRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
});

const GridWrapper = styled.View({
  marginTop: IMAGE_GAP,
});

export const MediaSectionView = React.memo(MediaSectionViewComponent);
MediaSectionView.displayName = 'MediaSectionView';
