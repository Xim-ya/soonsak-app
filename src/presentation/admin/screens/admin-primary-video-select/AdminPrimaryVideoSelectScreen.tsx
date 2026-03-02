/**
 * AdminPrimaryVideoSelectScreen - 어드민 대표 비디오 선택 페이지
 *
 * 콘텐츠의 비디오 목록을 표시하고 대표 비디오를 변경할 수 있는 화면
 */

import { useCallback, memo } from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BasePage } from '@/presentation/components/page';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { adminContentApi, type ContentVideoItem } from '@/features/admin';
import { useDialog } from '@/presentation/components/dialog';

const THUMBNAIL_WIDTH = AppSize.ratioWidth(120);
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (9 / 16);

// 뒤로가기 아이콘 SVG
const backIconSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 체크 아이콘 SVG
const checkIconSvg = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6L9 17L4 12" stroke="${colors.primary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export default function AdminPrimaryVideoSelectScreen() {
  const route = useRoute<ScreenRouteProp<typeof routePages.adminPrimaryVideoSelect>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showDialog, showConfirmDialog } = useDialog();

  const { contentId, contentType, contentTitle } = route.params;

  // 비디오 목록 조회
  const {
    data: videos,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['adminContentVideos', contentId, contentType],
    queryFn: () => adminContentApi.getContentVideos(contentId, contentType),
  });

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 비디오 선택 핸들러
  const handleSelectVideo = useCallback(async (video: ContentVideoItem) => {
    // 이미 대표 비디오인 경우
    if (video.isPrimary) {
      await showDialog({
        title: '알림',
        description: '이미 대표 비디오로 설정되어 있어요',
        buttonText: '확인',
      });
      return;
    }

    const result = await showConfirmDialog({
      title: '대표 비디오 변경',
      description: `"${video.title}"을(를) 대표 비디오로 설정할까요?`,
      leftButtonText: '취소',
      rightButtonText: '변경',
    });
    if (result === 'right') {
      handleChangePrimary(video.id, video.title);
    }
  }, [showDialog, showConfirmDialog]);

  // 대표 비디오 변경 처리
  const handleChangePrimary = useCallback(
    async (videoId: string, videoTitle: string) => {
      try {
        await adminContentApi.changePrimaryVideo(contentId, contentType, videoId);

        // 캐시 무효화
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['adminContentVideos', contentId, contentType],
          }),
          queryClient.invalidateQueries({
            queryKey: ['videos', contentId, contentType],
          }),
          queryClient.invalidateQueries({
            queryKey: ['videoCount', contentId, contentType],
          }),
        ]);

        // 목록 새로고침
        await refetch();

        await showDialog({
          title: '완료',
          description: `"${videoTitle}"을(를) 대표 비디오로 설정했어요`,
          buttonText: '확인',
        });
      } catch (error) {
        console.error('대표 비디오 변경 실패:', error);
        await showDialog({
          title: '오류',
          description: '대표 비디오를 변경하지 못했어요. 다시 시도해주세요.',
          buttonText: '확인',
        });
      }
    },
    [contentId, contentType, queryClient, refetch, showDialog],
  );

  const renderItem = useCallback(
    ({ item }: { item: ContentVideoItem }) => (
      <VideoItem video={item} onPress={handleSelectVideo} />
    ),
    [handleSelectVideo],
  );

  const keyExtractor = useCallback((item: ContentVideoItem) => item.id, []);

  return (
    <BasePage useSafeArea={false}>
      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={backIconSvg} width={24} height={24} />
        </BackButton>
        <HeaderTitle>대표 비디오 변경</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 콘텐츠 정보 */}
      <ContentInfoContainer>
        <ContentInfoLabel>콘텐츠</ContentInfoLabel>
        <ContentInfoTitle numberOfLines={1}>{contentTitle}</ContentInfoTitle>
      </ContentInfoContainer>

      {/* 안내 문구 */}
      <GuideText>변경할 비디오를 선택하세요</GuideText>

      {/* 비디오 목록 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : (
        <FlatList
          data={videos ?? []}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </BasePage>
  );
}

/* Video Item Component */
interface VideoItemProps {
  readonly video: ContentVideoItem;
  readonly onPress: (video: ContentVideoItem) => void;
}

const VideoItem = memo(function VideoItem({ video, onPress }: VideoItemProps) {
  const handlePress = useCallback(() => {
    onPress(video);
  }, [video, onPress]);

  return (
    <ItemContainer onPress={handlePress} activeOpacity={0.7}>
      <ThumbnailContainer>
        <LoadableImageView
          source={video.thumbnailUrl ?? ''}
          width={THUMBNAIL_WIDTH}
          height={THUMBNAIL_HEIGHT}
          borderRadius={6}
        />
        {video.isPrimary && (
          <PrimaryBadge>
            <PrimaryBadgeText>대표</PrimaryBadgeText>
          </PrimaryBadge>
        )}
      </ThumbnailContainer>
      <Gap size={12} />
      <ItemInfoContainer>
        <ItemTitle numberOfLines={2}>{video.title}</ItemTitle>
        <Gap size={4} />
        {video.channelName && (
          <ItemChannelText numberOfLines={1}>{video.channelName}</ItemChannelText>
        )}
        <Gap size={4} />
        <StatusBadge status={video.status}>
          <StatusText>{video.status}</StatusText>
        </StatusBadge>
      </ItemInfoContainer>
      {video.isPrimary && (
        <CheckIconContainer>
          <SvgXml xml={checkIconSvg} width={20} height={20} />
        </CheckIconContainer>
      )}
    </ItemContainer>
  );
});

/* Styled Components */
const HeaderContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: paddingTop + 8,
  paddingBottom: 12,
  paddingHorizontal: 16,
  backgroundColor: colors.black,
}));

const BackButton = styled(TouchableOpacity)({
  padding: 4,
});

const HeaderTitle = styled.Text({
  flex: 1,
  ...textStyles.title1,
  color: colors.white,
  textAlign: 'center',
});

const HeaderSpacer = styled.View({
  width: 32,
});

const ContentInfoContainer = styled.View({
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.gray06,
  marginHorizontal: 16,
  marginBottom: 8,
  borderRadius: 8,
});

const ContentInfoLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginBottom: 4,
});

const ContentInfoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const GuideText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
  paddingHorizontal: 16,
  paddingVertical: 12,
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const ItemContainer = styled(TouchableOpacity)({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 12,
  alignItems: 'center',
});

const ThumbnailContainer = styled.View({
  position: 'relative',
});

const PrimaryBadge = styled.View({
  position: 'absolute',
  top: 4,
  left: 4,
  backgroundColor: colors.primary,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
});

const PrimaryBadgeText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontSize: 10,
  fontWeight: '600',
});

const ItemInfoContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
});

const ItemTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
});

const ItemChannelText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

interface StatusBadgeProps {
  status: string;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return colors.green;
    case 'rejected':
      return colors.red;
    case 'needs_review':
      return colors.yellow;
    default:
      return colors.gray02;
  }
};

const StatusBadge = styled.View<StatusBadgeProps>(({ status }) => ({
  alignSelf: 'flex-start',
  backgroundColor: `${getStatusColor(status)}20`,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
}));

const StatusText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray01,
  fontSize: 10,
});

const CheckIconContainer = styled.View({
  marginLeft: 8,
});
