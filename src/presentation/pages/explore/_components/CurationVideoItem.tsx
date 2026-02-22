/**
 * CurationVideoItem - 큐레이션 캐러셀 아이템 컴포넌트
 *
 * 큐레이션 캐러셀에서 사용되는 비디오 아이템입니다.
 * 썸네일 하단에 채널 아바타와 작품 제목, 아래에 영상 제목과 메타 정보를 표시합니다.
 * 터치 시 콘텐츠 상세 페이지로 이동합니다.
 *
 * @example
 * <CurationVideoItem video={video} onPress={handlePress} />
 */

import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { useYouTubeChannel } from '@/features/youtube';
import { TMDB_GENRE_MAP } from '@/features/content/constants/genreConstants';
import type { CurationVideoModel } from '../_types/exploreTypes';

interface CurationVideoItemProps {
  readonly video: CurationVideoModel;
  readonly onPress: (video: CurationVideoModel) => void;
}

// 크기 상수
const THUMBNAIL_WIDTH = AppSize.ratioWidth(280);
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (157 / 280);
const VIDEO_TITLE_LINE_HEIGHT = (textStyles.body2.lineHeight as number) ?? 22;
const VIDEO_TITLE_MAX_LINES = 2;
const VIDEO_TITLE_HEIGHT = VIDEO_TITLE_LINE_HEIGHT * VIDEO_TITLE_MAX_LINES;
const GAP_SIZE = 8;
const ITEM_HEIGHT = THUMBNAIL_HEIGHT + GAP_SIZE + VIDEO_TITLE_HEIGHT;

// TMDB backdrop 이미지 URL 생성
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

// 가운데 점 구분자
const DOT_SEPARATOR = '·';

/** 날짜 문자열에서 연도 추출 */
function extractYear(dateString?: string): string {
  if (!dateString) return '';
  return dateString.slice(0, 4);
}

/** 장르 ID 배열을 이름 문자열로 변환 (최대 2개) */
function formatGenres(genreIds?: number[]): string {
  if (!genreIds || genreIds.length === 0) return '';
  return genreIds
    .slice(0, 2)
    .map((id) => TMDB_GENRE_MAP[id])
    .filter(Boolean)
    .join(DOT_SEPARATOR);
}

function CurationVideoItem({ video, onPress }: CurationVideoItemProps) {
  // DB에 채널 로고가 없고 channelId가 있을 때만 API 조회
  const shouldFetchChannel = !video.channelLogoUrl && !!video.channelId;
  const { data: fetchedChannel } = useYouTubeChannel(video.channelId ?? '', {
    enabled: shouldFetchChannel,
  });

  const handlePress = useCallback(() => {
    onPress(video);
  }, [video, onPress]);

  const backdropUrl = `${TMDB_IMAGE_BASE}${video.backdropPath}`;

  // DB 데이터 우선, 없으면 API 조회 결과 사용
  const channelLogoUrl = video.channelLogoUrl || fetchedChannel?.images?.avatar || '';

  // 메타 정보: 연도·장르·장르
  const releaseYear = extractYear(video.releaseDate);
  const genreText = formatGenres(video.genreIds);
  const metaInfo = [releaseYear, genreText].filter(Boolean).join(DOT_SEPARATOR);

  return (
    <Container>
      <ThumbnailTouchable onPress={handlePress} activeOpacity={0.8}>
        <ThumbnailWrapper>
          <LoadableImageView
            source={backdropUrl}
            width={THUMBNAIL_WIDTH}
            height={THUMBNAIL_HEIGHT}
            borderRadius={8}
          />
          <DarkedLinearShadow height={THUMBNAIL_HEIGHT} align={LinearAlign.bottomTop} />
          <ContentInfoWrapper>
            <RoundedAvatorView source={channelLogoUrl} size={28} />
            <Gap size={8} />
            <ContentInfoColumn>
              <ContentTitle numberOfLines={1}>{video.contentTitle}</ContentTitle>
              {metaInfo && <MetaInfo numberOfLines={1}>{metaInfo}</MetaInfo>}
            </ContentInfoColumn>
          </ContentInfoWrapper>
        </ThumbnailWrapper>
      </ThumbnailTouchable>
      <Gap size={8} />
      <VideoTitle numberOfLines={2} allowFontScaling={false}>
        {video.videoTitle}
      </VideoTitle>
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  width: THUMBNAIL_WIDTH,
  height: ITEM_HEIGHT,
});

const ThumbnailTouchable = styled(TouchableOpacity)({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
});

const ThumbnailWrapper = styled.View({
  width: THUMBNAIL_WIDTH,
  height: THUMBNAIL_HEIGHT,
  borderRadius: 8,
  overflow: 'hidden',
  backgroundColor: colors.gray05,
});

const ContentInfoWrapper = styled.View({
  position: 'absolute',
  bottom: 10,
  left: 10,
  right: 10,
  flexDirection: 'row',
  alignItems: 'center',
});

const ContentInfoColumn = styled.View({
  flex: 1,
  flexDirection: 'column',
});

const ContentTitle = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

const VideoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  height: VIDEO_TITLE_HEIGHT,
});

const MetaInfo = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

export { CurationVideoItem, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, VIDEO_TITLE_HEIGHT, ITEM_HEIGHT };
