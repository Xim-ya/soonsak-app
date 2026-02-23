/**
 * WatchHistoryCard - 시청 기록 카드 컴포넌트
 *
 * ChannelVideoCard와 동일한 레이아웃으로 시청 기록을 표시합니다.
 * - 전체 너비 backdrop 이미지 (16:9 비율)
 * - 하단 그라데이션 + 콘텐츠 제목 오버레이
 * - YouTube 스타일 프로그레스 바
 * - 런타임 칩
 *
 * @example
 * <WatchHistoryCard item={watchHistory} onPress={handlePress} />
 */

import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import { WatchProgressBar } from '@/presentation/components/progress';
import DarkChip from '@/presentation/components/chip/DarkChip';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { AppSize } from '@/shared/utils/appSize';
import { WatchHistoryModel } from '../types/watchHistoryModel';

/* Types */

interface WatchHistoryCardProps {
  readonly item: WatchHistoryModel;
  readonly onPress?: (item: WatchHistoryModel) => void;
}

/* Constants */

const HORIZONTAL_PADDING = 16;
const PROGRESS_BAR_HEIGHT = 3;

/** 태블릿에서 카드 고정 너비 */
const TABLET_CARD_WIDTH = 420;

/* Component */

function WatchHistoryCardComponent({ item, onPress }: WatchHistoryCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = AppSize.isLargeScreen();

  // Runtime 크기 계산 - 태블릿에서는 고정 크기 사용
  const dimensions = useMemo(() => {
    const cardWidth = isLargeScreen
      ? TABLET_CARD_WIDTH
      : screenWidth - HORIZONTAL_PADDING * 2;
    const cardHeight = cardWidth * (9 / 16); // 16:9 비율
    return { cardWidth, cardHeight, isLargeScreen };
  }, [screenWidth, isLargeScreen]);

  const handlePress = useCallback(() => {
    onPress?.(item);
  }, [item, onPress]);

  // 공통 유틸리티로 이미지 URL 추출 (backdrop > poster)
  const imageUrl = WatchHistoryModel.getImageUrl(item, {
    backdropSize: TmdbImageSize.w780,
    posterSize: TmdbImageSize.w342,
  });

  return (
    <Container cardWidth={dimensions.cardWidth} isLargeScreen={dimensions.isLargeScreen}>
      <ThumbnailTouchable
        onPress={handlePress}
        activeOpacity={0.8}
        cardWidth={dimensions.cardWidth}
        cardHeight={dimensions.cardHeight}
      >
        <ThumbnailWrapper cardWidth={dimensions.cardWidth} cardHeight={dimensions.cardHeight}>
          <LoadableImageView
            source={imageUrl}
            width={dimensions.cardWidth}
            height={dimensions.cardHeight}
            borderRadius={12}
          />
          <DarkedLinearShadow height={dimensions.cardHeight} align={LinearAlign.bottomTop} />

          {/* 런타임 칩 */}
          {item.durationSeconds > 0 && (
            <RuntimeChipContainer>
              <DarkChip content={formatter.formatRuntime(item.durationSeconds)} />
            </RuntimeChipContainer>
          )}

          {/* 콘텐츠 제목 오버레이 */}
          <ContentInfoWrapper>
            <ContentTitle numberOfLines={1}>{item.contentTitle}</ContentTitle>
          </ContentInfoWrapper>

          {/* 프로그레스 바 */}
          <ProgressBarWrapper>
            <WatchProgressBar
              progressSeconds={item.progressSeconds}
              durationSeconds={item.durationSeconds}
              height={PROGRESS_BAR_HEIGHT}
            />
          </ProgressBarWrapper>
        </ThumbnailWrapper>
      </ThumbnailTouchable>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View<{ cardWidth: number; isLargeScreen: boolean }>(
  ({ cardWidth, isLargeScreen }) => ({
    width: cardWidth,
    marginHorizontal: isLargeScreen ? 0 : HORIZONTAL_PADDING,
  }),
);

const ThumbnailTouchable = styled(TouchableOpacity)<{ cardWidth: number; cardHeight: number }>(
  ({ cardWidth, cardHeight }) => ({
    width: cardWidth,
    height: cardHeight,
  }),
);

const ThumbnailWrapper = styled.View<{ cardWidth: number; cardHeight: number }>(
  ({ cardWidth, cardHeight }) => ({
    width: cardWidth,
    height: cardHeight,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray05,
  }),
);

const RuntimeChipContainer = styled.View({
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
});

const ContentInfoWrapper = styled.View({
  position: 'absolute',
  bottom: 12,
  left: 12,
  right: 12,
});

const ContentTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const ProgressBarWrapper = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
});

export const WatchHistoryCard = memo(WatchHistoryCardComponent);
