/**
 * WatchHistoryListItem - 시청 기록 리스트 아이템 컴포넌트
 *
 * SearchResultItem과 유사한 스타일로 시청 기록을 표시합니다.
 * - 좌측: 포스터 이미지
 * - 우측: 제목, 타입, 프로그레스 정보
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { WatchProgressBar, shouldShowProgressBar } from '@/presentation/components/progress';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { contentTypeConfigs } from '@/presentation/types/content/contentType.enum';
import type { WatchHistoryModel } from '@/features/watch-history';

/** 포스터 비율 (2:3) */
const POSTER_ASPECT_RATIO = 1.5;

// 포스터 크기 (SearchResultItem과 동일)
const POSTER_WIDTH = AppSize.ratioWidth(79);
const POSTER_HEIGHT = POSTER_WIDTH * POSTER_ASPECT_RATIO;
const ITEM_PADDING = 16;
const PROGRESS_BAR_HEIGHT = 3;

interface WatchHistoryListItemProps {
  readonly item: WatchHistoryModel;
  readonly onPress?: (item: WatchHistoryModel) => void;
}

function WatchHistoryListItemComponent({ item, onPress }: WatchHistoryListItemProps) {
  const handlePress = useCallback(() => {
    onPress?.(item);
  }, [onPress, item]);

  // 포스터 이미지 URL (poster 우선)
  const posterUrl = item.contentPosterPath
    ? formatter.prefixTmdbImgUrl(item.contentPosterPath, { size: TmdbImageSize.w185 })
    : item.contentBackdropPath
      ? formatter.prefixTmdbImgUrl(item.contentBackdropPath, { size: TmdbImageSize.w342 })
      : '';

  // 콘텐츠 타입 라벨
  const typeLabel = contentTypeConfigs[item.contentType]?.label ?? '';

  // 진행률 표시 여부
  const showProgressBar = shouldShowProgressBar(item.progressSeconds, item.durationSeconds);

  // 런타임 텍스트 (남은 시간 또는 전체 시간)
  const runtimeText = item.durationSeconds > 0 ? formatter.formatRuntime(item.durationSeconds) : '';

  // 메타 정보
  const metaText = [typeLabel, runtimeText].filter(Boolean).join(' · ');

  return (
    <Container onPress={handlePress} activeOpacity={0.7}>
      <PosterWrapper>
        <LoadableImageView
          source={posterUrl}
          width={POSTER_WIDTH}
          height={POSTER_HEIGHT}
          borderRadius={4}
        />
        {showProgressBar && (
          <ProgressBarWrapper>
            <WatchProgressBar
              progressSeconds={item.progressSeconds}
              durationSeconds={item.durationSeconds}
              height={PROGRESS_BAR_HEIGHT}
            />
          </ProgressBarWrapper>
        )}
      </PosterWrapper>
      <Gap size={12} />
      <InfoContainer>
        <Title numberOfLines={2}>{item.contentTitle}</Title>
        <Gap size={4} />
        {metaText && <MetaText>{metaText}</MetaText>}
      </InfoContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled(TouchableOpacity)({
  flexDirection: 'row',
  paddingHorizontal: ITEM_PADDING,
  paddingVertical: 12,
});

const PosterWrapper = styled.View({
  position: 'relative',
  borderRadius: 4,
  overflow: 'hidden',
});

const ProgressBarWrapper = styled.View({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
});

const InfoContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
});

const Title = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const MetaText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

export const WatchHistoryListItem = memo(WatchHistoryListItemComponent);
