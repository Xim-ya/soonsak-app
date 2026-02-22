import React, { ReactNode, useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { CARD_SLIDER } from '@/presentation/components/slider/HorizontalCardSlider';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 카드 이미지에 표시할 수 있는 콘텐츠 아이템 인터페이스
 */
export interface CardContentItem extends Omit<BaseContentModel, 'backdropPath'> {
  readonly backdropPath: string | undefined;
}

interface ContentCardImageProps {
  item: CardContentItem;
  /** 이미지 위에 표시할 오버레이 (예: RuntimeChip) */
  overlay?: ReactNode;
  /** 타이틀 텍스트 left 오프셋 (기본값: 8, 오버레이가 있으면 60 권장) */
  titleLeftOffset?: number;
}

/**
 * 콘텐츠 카드 이미지 공통 컴포넌트
 * 이미지 + 그래디언트 + 타이틀 + 네비게이션 + 오버레이 슬롯
 */
const ContentCardImage = React.memo(
  ({ item, overlay, titleLeftOffset = 8 }: ContentCardImageProps) => {
    const navigation = useNavigation<NavigationProp>();

    // initialData로 이미지 경로를 전달하여 API 응답 전에 즉시 표시
    const handlePress = useCallback(() => {
      navigation.navigate(routePages.contentDetail, {
        id: item.id,
        title: item.title,
        type: item.type,
        initialData: {
          ...(item.backdropPath && { backdropPath: item.backdropPath }),
          posterPath: item.posterPath,
        },
      });
    }, [navigation, item.id, item.title, item.type, item.backdropPath, item.posterPath]);

    const imageUrl = useMemo(
      () =>
        item.backdropPath
          ? formatter.prefixTmdbImgUrl(item.backdropPath, { size: TmdbImageSize.w780 })
          : formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w500 }),
      [item.backdropPath, item.posterPath],
    );

    return (
      <ItemTouchable onPress={handlePress} activeOpacity={0.8}>
        <ImageWrapper>
          <LoadableImageView
            source={imageUrl}
            width={CARD_SLIDER.ITEM_WIDTH}
            height={CARD_SLIDER.ITEM_HEIGHT}
            borderRadius={4}
          />
          <GradientOverlay
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {overlay}
          <TitleText numberOfLines={1} leftOffset={titleLeftOffset}>
            {item.title}
          </TitleText>
        </ImageWrapper>
      </ItemTouchable>
    );
  },
);
ContentCardImage.displayName = 'ContentCardImage';

/* Styled Components */

const ItemTouchable = styled(TouchableOpacity)({
  width: CARD_SLIDER.ITEM_WIDTH,
  height: CARD_SLIDER.ITEM_HEIGHT,
});

const ImageWrapper = styled.View({
  width: CARD_SLIDER.ITEM_WIDTH,
  height: CARD_SLIDER.ITEM_HEIGHT,
  borderRadius: 4,
  overflow: 'hidden',
  position: 'relative',
});

const GradientOverlay = styled(LinearGradient)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 49,
});

const TitleText = styled.Text<{ leftOffset: number }>(({ leftOffset }) => ({
  ...textStyles.title3,
  color: colors.white,
  position: 'absolute',
  left: leftOffset,
  right: 8,
  bottom: 6,
  textAlign: 'right',
}));

export { ContentCardImage };
