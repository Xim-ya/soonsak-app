import React, { useCallback, useMemo, useEffect } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenRouteProp, RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useContentImages } from '@/features/tmdb/hooks/useContentImages';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { ImageGrid } from '@/presentation/components/image/ImageGrid';
import { analyticsService } from '@/shared/analytics';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { AppSize } from '@/shared/utils/appSize';
import colors from '@/shared/styles/colors';

type MediaListRouteProp = ScreenRouteProp<typeof routePages.mediaList>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HORIZONTAL_PADDING = 16;
const IMAGE_GAP = 4;

function MediaListScreenComponent() {
  const route = useRoute<MediaListRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { contentId, contentType, backdropPath } = route.params;

  const { data: images } = useContentImages(contentId, contentType, backdropPath);

  const containerWidth = AppSize.screenWidth - HORIZONTAL_PADDING * 2;
  const heroImageHeight = containerWidth * (9 / 16);
  const gridItemWidth = (containerWidth - IMAGE_GAP) / 2;
  const gridItemHeight = gridItemWidth * (9 / 16);

  const heroImage = images[0];
  const gridImages = useMemo(() => images.slice(1), [images]);

  // GA4 media_list_view 이벤트 로깅
  useEffect(() => {
    if (images.length > 0) {
      analyticsService.mediaListView({
        content_id: contentId,
        content_type: contentType,
        total_count: images.length,
      });
    }
  }, [contentId, contentType, images.length]);

  const handleImagePress = useCallback(
    (index: number) => {
      // GA4 media_image_click 이벤트 로깅
      analyticsService.mediaImageClick({
        content_id: contentId,
        image_index: index,
      });
      navigation.navigate(routePages.imageDetail, {
        contentId,
        contentType,
        backdropPath,
        initialIndex: index,
      });
    },
    [navigation, contentId, contentType, backdropPath],
  );

  return (
    <PageContainer>
      <SafeAreaView edges={['top']} style={safeAreaStyle}>
        <BackButtonAppBar title="스틸컷" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 상단 대형 이미지 */}
          {heroImage && (
            <HeroContainer>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleImagePress(0)}>
                <LoadableImageView
                  source={formatter.prefixTmdbImgUrl(heroImage.filePath, {
                    size: TmdbImageSize.w780,
                  })}
                  width={containerWidth}
                  height={heroImageHeight}
                  borderRadius={4}
                />
              </TouchableOpacity>
            </HeroContainer>
          )}

          {/* 2열 그리드 */}
          {gridImages.length > 0 && (
            <GridContainer>
              <ImageGrid
                images={gridImages}
                itemWidth={gridItemWidth}
                itemHeight={gridItemHeight}
                gap={IMAGE_GAP}
                onImagePress={handleImagePress}
                indexOffset={1}
              />
            </GridContainer>
          )}
        </ScrollView>
      </SafeAreaView>
    </PageContainer>
  );
}

const safeAreaStyle = { flex: 1, backgroundColor: colors.black } as const;

const PageContainer = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const HeroContainer = styled.View({
  paddingHorizontal: HORIZONTAL_PADDING,
  paddingTop: 12,
  paddingBottom: 16,
});

const GridContainer = styled.View({
  paddingHorizontal: HORIZONTAL_PADDING,
  paddingBottom: 40,
});

export const MediaListScreen = React.memo(MediaListScreenComponent);
MediaListScreen.displayName = 'MediaListScreen';
