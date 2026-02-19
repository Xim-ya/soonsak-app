/**
 * ExploreContentCard - 그리드 아이템 카드
 *
 * 2열 그리드용 포스터 카드로, 이미지 위에 그라데이션 오버레이와 함께
 * ContentTypeChip과 제목을 표시합니다.
 */

import React, { useCallback } from 'react';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import ContentTypeChip from '@/presentation/components/chip/ContentTypeChip';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import type { ExploreContentModel } from '../_types/exploreTypes';

/** 포스터 없을 때 표시할 아이콘 */
const noImageIconSvg = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="3" width="20" height="18" rx="2" stroke="${colors.gray03}" stroke-width="1.5"/>
<circle cx="8.5" cy="8.5" r="2" stroke="${colors.gray03}" stroke-width="1.5"/>
<path d="M21 15L16.5 10L11 15.5" stroke="${colors.gray03}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14 18L9.5 13.5L3 20" stroke="${colors.gray03}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/** 그리드 레이아웃 상수 */
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 8;
const COLUMN_COUNT = 2;
/** 포스터 비율 168:240 (참고 UI 기준) */
const POSTER_ASPECT_RATIO = 240 / 168;

/** AppSize 기반 반응형 카드 크기 계산 */
const CARD_WIDTH = (AppSize.screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / COLUMN_COUNT;
const CARD_HEIGHT = CARD_WIDTH * POSTER_ASPECT_RATIO;

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

  return (
    <CardContainer onPress={handlePress} activeOpacity={0.8}>
      {imageUrl ? (
        <LoadableImageView
          source={imageUrl}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          borderRadius={8}
        />
      ) : (
        <PlaceholderContainer>
          <SvgXml xml={noImageIconSvg} width={40} height={40} />
        </PlaceholderContainer>
      )}
      {/* 상단 좌측 칩 */}
      <ChipContainer>
        <ContentTypeChip contentType={content.type} />
      </ChipContainer>
      {/* 하단 그라데이션 + 제목 */}
      <GradientOverlay colors={['transparent', 'rgba(0, 0, 0, 0.8)']} />
      <TitleContainer>
        <CardTitle numberOfLines={2}>{content.title}</CardTitle>
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
  backgroundColor: colors.gray05,
});

const PlaceholderContainer = styled.View({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
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
  fontSize: 16,
  fontFamily: 'DoHyeon-Regular',
  color: colors.white,
  textAlign: 'center',
});

export { ExploreContentCard, CARD_WIDTH, CARD_HEIGHT, GRID_GAP, HORIZONTAL_PADDING };
