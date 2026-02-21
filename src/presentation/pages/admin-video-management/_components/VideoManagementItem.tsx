/**
 * VideoManagementItem - 비디오 관리 아이템
 *
 * 비디오 정보를 표시하고, 탭하면 ContentDetailPage로 이동
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import type { VideoManagementItem as VideoManagementItemType } from '@/features/admin';
import { ContentStatus, ContentStatusLabel } from '@/features/content/types';

const POSTER_WIDTH = AppSize.ratioWidth(70);
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

// 화살표 아이콘 SVG
const chevronRightSvg = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 18L15 12L9 6" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface VideoManagementItemProps {
  readonly video: VideoManagementItemType;
  readonly onPress: (video: VideoManagementItemType) => void;
}

export const VideoManagementItem = memo(function VideoManagementItem({
  video,
  onPress,
}: VideoManagementItemProps) {
  const handlePress = useCallback(() => {
    onPress(video);
  }, [video, onPress]);

  // 등록일 포맷
  const formattedDate = formatDate(video.uploadedAt);

  // 포스터 URL
  const posterUrl = video.contentPosterPath
    ? formatter.prefixTmdbImgUrl(video.contentPosterPath, { size: TmdbImageSize.w185 })
    : '';

  return (
    <Container onPress={handlePress} activeOpacity={0.7}>
      {/* 포스터 */}
      <PosterContainer>
        <LoadableImageView
          source={posterUrl}
          width={POSTER_WIDTH}
          height={POSTER_HEIGHT}
          borderRadius={6}
        />
      </PosterContainer>

      <Gap size={12} />

      {/* 정보 */}
      <InfoContainer>
        <VideoTitle numberOfLines={2}>{video.title}</VideoTitle>
        <Gap size={4} />
        <ContentTitle numberOfLines={1}>{video.contentTitle}</ContentTitle>
        <Gap size={2} />
        {video.channelName && (
          <ChannelName numberOfLines={1}>{video.channelName}</ChannelName>
        )}
        <Gap size={6} />
        <MetaRow>
          <DateText>{formattedDate}</DateText>
          <StatusBadge status={video.status}>
            <StatusText status={video.status}>
              {ContentStatusLabel[video.status] || video.status}
            </StatusText>
          </StatusBadge>
        </MetaRow>
      </InfoContainer>

      {/* 화살표 */}
      <ChevronContainer>
        <SvgXml xml={chevronRightSvg} width={16} height={16} />
      </ChevronContainer>
    </Container>
  );
});

/**
 * ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * 상태별 색상 반환
 */
function getStatusColor(status: ContentStatus): string {
  switch (status) {
    case ContentStatus.CONFIRMED:
      return colors.green;
    case ContentStatus.REJECTED:
      return colors.red;
    case ContentStatus.NEEDS_REVIEW:
      return colors.yellow;
    case ContentStatus.PENDING:
    default:
      return colors.gray02;
  }
}

/* Styled Components */
const Container = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.black,
});

const PosterContainer = styled.View({
  position: 'relative',
});

const InfoContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
});

const VideoTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
});

const ContentTitle = styled.Text({
  ...textStyles.desc,
  color: colors.gray01,
});

const ChannelName = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const MetaRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
});

const DateText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

interface StatusStyleProps {
  status: ContentStatus;
}

const StatusBadge = styled.View<StatusStyleProps>(({ status }) => ({
  backgroundColor: `${getStatusColor(status)}20`,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
}));

const StatusText = styled.Text<StatusStyleProps>(({ status }) => ({
  ...textStyles.alert2,
  color: getStatusColor(status),
  fontSize: 10,
  fontWeight: '600',
}));

const ChevronContainer = styled.View({
  marginLeft: 8,
});
