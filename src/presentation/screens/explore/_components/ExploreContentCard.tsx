/**
 * ExploreContentCard - 그리드 아이템 카드
 *
 * 반응형 그리드용 포스터 카드로, 이미지 위에 그라데이션 오버레이와 함께
 * ContentTypeChip과 제목을 표시합니다.
 *
 * 태블릿에서는 카드 너비가 props로 전달되어 가변 열 수를 지원합니다.
 */

import React, { useCallback } from 'react';
import { Image, Dimensions } from 'react-native';
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
const GRID_GAP = 12;

/** 카드 최소 너비 (이 값 기준으로 열 수 계산) */
const MIN_CARD_WIDTH = 150;

/** 카드 비율 168:240 (참고 UI 기준) - width/height */
const CARD_ASPECT_RATIO = 168 / 240;

/**
 * 화면 너비 기반 그리드 레이아웃 계산
 * - 최소 카드 너비 기준으로 열 수 결정
 * - 카드가 공간을 균등하게 채우도록 실제 너비 계산
 */
function calculateGridLayout(screenWidth: number) {
  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const columnCount = Math.max(
    2,
    Math.floor((availableWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)),
  );
  const cardWidth = (availableWidth - GRID_GAP * (columnCount - 1)) / columnCount;
  const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);

  return { columnCount, cardWidth, cardHeight };
}

/** 실제 화면 너비 기반 기본 레이아웃 (폰용) */
const DEFAULT_SCREEN_WIDTH = AppSize.actualScreenWidth || Dimensions.get('window').width;
const DEFAULT_LAYOUT = calculateGridLayout(DEFAULT_SCREEN_WIDTH);

interface ExploreContentCardProps {
  /** 콘텐츠 데이터 */
  readonly content: ExploreContentModel;
  /** 카드 클릭 콜백 */
  readonly onPress: (content: ExploreContentModel) => void;
  /** 동적 카드 너비 (태블릿 그리드용) */
  readonly cardWidth?: number;
}

const ExploreContentCard = React.memo(function ExploreContentCard({
  content,
  onPress,
  cardWidth: propCardWidth,
}: ExploreContentCardProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress(content);
  }, [content, onPress]);

  // 동적 카드 크기 (props 우선, 없으면 기본값)
  const cardWidth = propCardWidth ?? DEFAULT_LAYOUT.cardWidth;
  const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);

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
    <CardContainer
      onPress={handlePress}
      activeOpacity={0.8}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
    >
      <BackdropImage
        width={cardWidth}
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
          <TitleLogoImage
            source={{ uri: titleLogoUrl }}
            style={{ width: cardWidth - 16 }}
            resizeMode="contain"
          />
        ) : (
          <CardTitle numberOfLines={2}>{content.title}</CardTitle>
        )}
      </TitleContainer>
    </CardContainer>
  );
});

interface CardContainerProps {
  cardWidth: number;
  cardHeight: number;
}

const CardContainer = styled.TouchableOpacity<CardContainerProps>(({ cardWidth, cardHeight }) => ({
  width: cardWidth,
  height: cardHeight,
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
}));

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
  height: 40,
});

export {
  ExploreContentCard,
  calculateGridLayout,
  GRID_GAP,
  HORIZONTAL_PADDING,
  MIN_CARD_WIDTH,
  CARD_ASPECT_RATIO,
  DEFAULT_LAYOUT,
};
