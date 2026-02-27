/**
 * CurationVideoItem - 큐레이션 캐러셀 아이템 컴포넌트
 *
 * 탐색 페이지 상단 큐레이션 캐러셀에서 사용되는 비디오 아이템입니다.
 * 썸네일 하단에 콘텐츠 제목(좌) <-> 런타임 칩(우)을 오버레이로 표시합니다.
 * 썸네일 아래에 비디오 제목·년도·장르를 배치합니다. (채널 아바타 없음)
 * 터치 시 콘텐츠 상세 페이지로 이동합니다.
 *
 * @example
 * <CurationVideoItem video={video} onPress={handlePress} />
 */

import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';
import DarkChip from '@/presentation/components/chip/DarkChip';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { formatter } from '@/shared/utils/formatter';
import { TMDB_GENRE_MAP } from '@/features/content/constants/genreConstants';
import type { CurationVideoModel } from '../_types/exploreTypes';

interface CurationVideoItemProps {
  readonly video: CurationVideoModel;
  readonly onPress: (video: CurationVideoModel) => void;
}

// 크기 상수
const THUMBNAIL_WIDTH = AppSize.ratioWidth(280);
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (9 / 16); // 16:9 비율

// 썸네일 아래 정보 영역 높이 (채널 아바타 없음)
const INFO_SECTION_GAP = 8;
const VIDEO_TITLE_LINE_HEIGHT = 22;
const VIDEO_TITLE_MAX_LINES = 2;
const META_LINE_HEIGHT = 16;
const INFO_SECTION_HEIGHT = VIDEO_TITLE_LINE_HEIGHT * VIDEO_TITLE_MAX_LINES + 2 + META_LINE_HEIGHT;

// 전체 아이템 높이 (썸네일 + Gap + 정보 영역)
const ITEM_HEIGHT = THUMBNAIL_HEIGHT + INFO_SECTION_GAP + INFO_SECTION_HEIGHT;

// TMDB backdrop 이미지 URL 생성
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

// 가운데 점 구분자
const DOT_SEPARATOR = ' · ';

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
  const handlePress = useCallback(() => {
    onPress(video);
  }, [video, onPress]);

  const backdropUrl = video.backdropPath ? `${TMDB_IMAGE_BASE}${video.backdropPath}` : undefined;

  // 메타 정보: 년도 · 장르
  const releaseYear = extractYear(video.releaseDate);
  const genreText = formatGenres(video.genreIds);
  const metaParts = [releaseYear, genreText].filter(Boolean);
  const metaInfo = metaParts.join(DOT_SEPARATOR);

  // 런타임 포맷팅
  const runtimeText = video.runtime ? formatter.formatRuntime(video.runtime) : undefined;

  return (
    <Container>
      {/* 썸네일 영역 */}
      <ThumbnailTouchable onPress={handlePress} activeOpacity={0.8}>
        <ThumbnailWrapper>
          {backdropUrl && (
            <LoadableImageView
              source={backdropUrl}
              width={THUMBNAIL_WIDTH}
              height={THUMBNAIL_HEIGHT}
              borderRadius={12}
            />
          )}
          {/* 하단 그라데이션 오버레이 */}
          <DarkedLinearShadow height={THUMBNAIL_HEIGHT} align={LinearAlign.bottomTop} />
          {/* 하단 오버레이: 콘텐츠 제목(좌) <-> 런타임(우) */}
          <OverlayRow>
            <ContentTitle numberOfLines={1}>{video.contentTitle}</ContentTitle>
            {runtimeText && <DarkChip content={runtimeText} />}
          </OverlayRow>
        </ThumbnailWrapper>
      </ThumbnailTouchable>

      <Gap size={INFO_SECTION_GAP} />

      {/* 정보 영역: 비디오 제목 + 메타정보 (채널 아바타 없음) */}
      <InfoSection>
        <VideoTitle numberOfLines={VIDEO_TITLE_MAX_LINES} allowFontScaling={false}>
          {video.videoTitle}
        </VideoTitle>
        {metaInfo && <MetaInfo numberOfLines={1}>{metaInfo}</MetaInfo>}
      </InfoSection>
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
  borderRadius: 12, // ContentDetailPage와 동일
  overflow: 'hidden',
  backgroundColor: colors.gray05,
});

const OverlayRow = styled.View({
  position: 'absolute',
  bottom: 10,
  left: 10,
  right: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ContentTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  flex: 1,
  marginRight: 6,
});

const InfoSection = styled.View({
  flex: 1,
});

const VideoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  lineHeight: VIDEO_TITLE_LINE_HEIGHT,
});

const MetaInfo = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: 2,
  lineHeight: META_LINE_HEIGHT,
});

export { CurationVideoItem, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, INFO_SECTION_HEIGHT, ITEM_HEIGHT };
