import React, { useState, useCallback, useMemo } from 'react';
import { TouchableOpacity, StatusBar } from 'react-native';
import styled from '@emotion/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import Gallery from 'react-native-awesome-gallery';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { useContentImages } from '@/features/tmdb/hooks/useContentImages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

type ImageDetailRouteProp = ScreenRouteProp<typeof routePages.imageDetail>;

const CLOSE_ICON_SIZE = 24;

const closeIconSvg = `
<svg width="${CLOSE_ICON_SIZE}" height="${CLOSE_ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" fill="${colors.white}"/>
</svg>
`;

const GALLERY_STYLE = { backgroundColor: colors.black } as const;

function ImageDetailScreenComponent() {
  const route = useRoute<ImageDetailRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { contentId, contentType, backdropPath, initialIndex } = route.params;

  const { data: images } = useContentImages(contentId, contentType, backdropPath);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const imageUrls = useMemo(
    () =>
      images.map((img) =>
        formatter.prefixTmdbImgUrl(img.filePath, { size: TmdbImageSize.original }),
      ),
    [images],
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleIndexChange = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const indexText = `${currentIndex + 1}/${images.length}`;

  if (images.length === 0) return null;

  return (
    <Container>
      <StatusBar barStyle="light-content" hidden={false} />

      {/* 풀스크린 갤러리 */}
      <Gallery
        data={imageUrls}
        initialIndex={initialIndex}
        onIndexChange={handleIndexChange}
        maxScale={4}
        doubleTapScale={2}
        style={GALLERY_STYLE}
      />

      {/* 상단 바 (X 닫기 + 인덱스 카운터) */}
      <TopBar topInset={insets.top}>
        <CloseButton onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={closeIconSvg} width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} />
        </CloseButton>

        <IndexCounter>{indexText}</IndexCounter>

        {/* 우측 빈 공간 (레이아웃 균형용) */}
        <Spacer />
      </TopBar>
    </Container>
  );
}

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const TopBar = styled.View<{ topInset: number }>(({ topInset }) => ({
  position: 'absolute',
  top: topInset,
  left: 0,
  right: 0,
  height: 48,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  zIndex: 10,
}));

const CloseButton = styled(TouchableOpacity)({
  width: CLOSE_ICON_SIZE,
  height: CLOSE_ICON_SIZE,
  justifyContent: 'center',
  alignItems: 'center',
});

const IndexCounter = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const Spacer = styled.View({
  width: CLOSE_ICON_SIZE,
});

export const ImageDetailScreen = React.memo(ImageDetailScreenComponent);
ImageDetailScreen.displayName = 'ImageDetailScreen';
