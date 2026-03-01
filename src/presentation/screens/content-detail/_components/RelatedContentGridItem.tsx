import React, { useCallback } from 'react';
import styled from '@emotion/native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { RelatedContentModel } from '../_types/relatedContentModel.cd';

interface RelatedContentGridItemProps {
  content: RelatedContentModel;
}

// 태블릿 레이아웃 상수
const TABLET_CONTENT_MAX_WIDTH = 800;
const HORIZONTAL_PADDING = 32;
const TOTAL_GAP = 18; // 3열 간격 합계

// 3열 그리드 상수 계산 함수 (태블릿 대응)
function calculateGridWidth(): number {
  const isLargeScreen = AppSize.isLargeScreen();
  const baseWidth = isLargeScreen
    ? Math.min(AppSize.actualScreenWidth, TABLET_CONTENT_MAX_WIDTH)
    : AppSize.screenWidth;
  return (baseWidth - HORIZONTAL_PADDING - TOTAL_GAP) / 3;
}

// 3열 그리드 상수 (OriginContentTabView에서도 사용)
export const GRID_ITEM_WIDTH = calculateGridWidth();
export const GRID_POSTER_HEIGHT = GRID_ITEM_WIDTH * 1.5;
export const GRID_COLUMN_GAP = 9;

/**
 * RelatedContentGridItem - 관련 콘텐츠 그리드 아이템 컴포넌트
 *
 * 관련 콘텐츠 탭에서 3열 그리드로 표시되는 콘텐츠 아이템입니다.
 * 포스터 이미지와 제목을 표시하며, 클릭 시 해당 콘텐츠 상세 페이지로 이동합니다.
 *
 * @example
 * <RelatedContentGridItem content={relatedContent} />
 */
function RelatedContentGridItem({ content }: RelatedContentGridItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const posterUrl = formatter.prefixTmdbImgUrl(content.posterPath, {
    size: TmdbImageSize.w342,
  });

  const handlePress = useCallback(() => {
    navigation.push(routePages.contentDetail, {
      id: content.id,
      title: content.title,
      type: content.contentType,
    });
  }, [navigation, content.id, content.title, content.contentType]);

  return (
    <Container>
      <Pressable onPress={handlePress}>
        <PosterWrapper>
          <LoadableImageView
            source={posterUrl}
            width={GRID_ITEM_WIDTH}
            height={GRID_POSTER_HEIGHT}
            borderRadius={4}
          />
          {content.isRecommended && (
            <ChipWrapper>
              <RecommendChip>
                <RecommendChipText>추천</RecommendChipText>
              </RecommendChip>
            </ChipWrapper>
          )}
        </PosterWrapper>
      </Pressable>
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

const ChipWrapper = styled.View({
  position: 'absolute',
  left: 5,
  top: 6,
});

const RecommendChip = styled.View({
  backgroundColor: colors.white,
  paddingHorizontal: 5,
  paddingVertical: 2,
  borderRadius: 4,
});

const RecommendChipText = styled.Text({
  ...textStyles.nav,
  color: colors.black,
});

export const MemoizedRelatedContentGridItem = React.memo(RelatedContentGridItem);
