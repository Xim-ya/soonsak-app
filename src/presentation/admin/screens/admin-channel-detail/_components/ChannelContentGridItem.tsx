/**
 * ChannelContentGridItem - 채널 콘텐츠 그리드 아이템
 *
 * 3열 그리드에서 포스터 이미지, 제목, 영상 수를 표시합니다.
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { formatter, TmdbImageSize } from '@/core/utils/formatter';
import { AppSize } from '@/presentation/utils/appSize';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { ChannelContentItem } from '@/features/admin/api/adminChannelApi';

// ============================================================================
// Constants
// ============================================================================

/** 3열 그리드 아이템 너비 (패딩 32px + 간격 18px 고려) */
export const GRID_ITEM_WIDTH = (AppSize.screenWidth - 32 - 18) / 3;

/** 포스터 높이 (1.5 비율) */
export const GRID_POSTER_HEIGHT = GRID_ITEM_WIDTH * 1.5;

/** 그리드 아이템 전체 높이 (포스터 + 텍스트 영역) */
export const GRID_ITEM_HEIGHT = GRID_POSTER_HEIGHT + 44 + 16;

// ============================================================================
// Types
// ============================================================================

interface ChannelContentGridItemProps {
  readonly item: ChannelContentItem;
  readonly onPress: (item: ChannelContentItem) => void;
}

// ============================================================================
// Component
// ============================================================================

function ChannelContentGridItem({ item, onPress }: ChannelContentGridItemProps) {
  const posterUrl = item.posterPath
    ? formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w342 })
    : null;

  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  return (
    <Container>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <PosterWrapper>
          <LoadableImageView
            source={posterUrl ?? ''}
            width={GRID_ITEM_WIDTH}
            height={GRID_POSTER_HEIGHT}
            borderRadius={4}
          />
        </PosterWrapper>

        <TextContainer>
          <ContentTitle numberOfLines={1}>{item.contentTitle}</ContentTitle>
          <VideoCountText>영상 {item.videoCount}개</VideoCountText>
        </TextContainer>
      </TouchableOpacity>
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(View)({
  width: GRID_ITEM_WIDTH,
  marginBottom: 16,
});

const PosterWrapper = styled(View)({
  position: 'relative',
});

const TextContainer = styled(View)({
  marginTop: 6,
});

const ContentTitle = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});

const VideoCountText = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
  marginTop: 2,
});

// ============================================================================
// Memoized Export
// ============================================================================

export const MemoizedChannelContentGridItem = React.memo(ChannelContentGridItem);
