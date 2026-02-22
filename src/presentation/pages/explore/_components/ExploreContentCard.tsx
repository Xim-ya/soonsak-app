/**
 * ExploreContentCard - 그리드 아이템 카드
 *
 * 2열 그리드용 포스터 카드로, 이미지 위에 그라데이션 오버레이와 함께
 * ContentTypeChip과 제목을 표시합니다.
 */

import React, { useCallback } from 'react';
import { Image } from 'react-native';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackdropImage } from '@/presentation/components/image';
import ContentTypeChip from '@/presentation/components/chip/ContentTypeChip';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import type { ExploreContentModel } from '../_types/exploreTypes';

/** 그리드 레이아웃 상수 */
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 8;
const COLUMN_COUNT = 2;
/** 카드 비율 168:240 (참고 UI 기준) - width/height */
const CARD_ASPECT_RATIO = 168 / 240;

/** AppSize 기반 반응형 카드 크기 계산 */
const CARD_WIDTH = (AppSize.screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / COLUMN_COUNT;
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT_RATIO);

interface ExploreContentCardProps {
  /** 콘텐츠 데이터 */
  readonly content: ExploreContentModel;
  /** 카드 클릭 콜백 */
  readonly onPress: (content: ExploreContentModel) => void;
}

const ExploreContentCard = React.memo(function ExploreContentCard({
  content,
  onPress,
}: ExploreContentCardProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress(content);
  }, [content, onPress]);

  // backdropPath 우선, 없으면 posterPath 사용
  const imageUrl = content.backdropPath
    ? `https://image.tmdb.org/t/p/w780${content.backdropPath}`
    : content.posterPath
      ? `https://image.tmdb.org/t/p/w342${content.posterPath}`
      : null;

  // 타이틀 로고 URL (한국어 로고만 매핑 단계에서 필터링됨)
  const titleLogoUrl = content.titleLogo
    ? formatter.prefixTmdbImgUrl(content.titleLogo, { size: TmdbImageSize.w342 })
    : null;

  return (
    <CardContainer onPress={handlePress} activeOpacity={0.8}>
      <BackdropImage
        width={CARD_WIDTH}
        source={imageUrl ?? undefined}
        aspectRatio={CARD_ASPECT_RATIO}
        borderRadius={8}
      />
      {/* 상단 좌측 칩 */}
      <ChipContainer>
        <ContentTypeChip contentType={content.type} />
      </ChipContainer>
      {/* 하단 그라데이션 + 제목/로고 */}
      <GradientOverlay colors={['transparent', 'rgba(0, 0, 0, 0.8)']} />
      <TitleContainer>
        {titleLogoUrl ? (
          <TitleLogoImage source={{ uri: titleLogoUrl }} resizeMode="contain" />
        ) : (
          <CardTitle numberOfLines={2}>{content.title}</CardTitle>
        )}
      </TitleContainer>
    </CardContainer>
  );
});

const CardContainer = styled.TouchableOpacity({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
});

const ChipContainer = styled.View({
  position: 'absolute',
  top: 8,
  left: 8,
});

const GradientOverlay = styled(LinearGradient)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '40%',
  borderBottomLeftRadius: 8,
  borderBottomRightRadius: 8,
});

const TitleContainer = styled.View({
  position: 'absolute',
  left: 8,
  right: 8,
  bottom: 10,
  alignItems: 'center',
});

const CardTitle = styled.Text({
  fontSize: 18,
  fontFamily: 'DoHyeon-Regular',
  color: colors.white,
  textAlign: 'center',
});

const TitleLogoImage = styled(Image)({
  width: CARD_WIDTH - 16,
  height: 40,
});

export { ExploreContentCard, CARD_WIDTH, CARD_HEIGHT, GRID_GAP, HORIZONTAL_PADDING };
