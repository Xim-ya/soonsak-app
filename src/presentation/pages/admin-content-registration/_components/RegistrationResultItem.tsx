/**
 * RegistrationResultItem - 등록 결과 아이템 컴포넌트
 *
 * 영상/채널 등록 결과의 개별 아이템을 렌더링합니다.
 * VideoRegistrationTab과 ChannelRegistrationTab에서 공통으로 사용됩니다.
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { PosterImage } from '@/presentation/components/image/PosterImage';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { RootStackParamList } from '@/shared/navigation/types';

interface RegistrationResultItemData {
  readonly videoId: string;
  readonly videoTitle?: string | undefined;
  readonly contentId?: number | null | undefined;
  readonly contentType?: 'movie' | 'tv' | null | undefined;
  readonly contentTitle?: string | null | undefined;
  readonly posterPath?: string | null | undefined;
  readonly success?: boolean | undefined;
  readonly error?: string | undefined;
}

interface RegistrationResultItemProps {
  readonly item: RegistrationResultItemData;
  readonly index: number;
  readonly showErrorState?: boolean;
}

function RegistrationResultItemComponent({
  item,
  index,
  showErrorState = false,
}: RegistrationResultItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const isClickable = showErrorState
    ? item.success && item.contentId && item.contentType
    : item.contentId && item.contentType;

  const posterUrl = item.posterPath
    ? formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w185 })
    : '';

  const handlePress = useCallback(() => {
    if (!item.contentId || !item.contentType) return;

    const contentType: ContentType = item.contentType === 'movie' ? 'movie' : 'tv';

    navigation.navigate(routePages.contentDetail, {
      id: item.contentId,
      title: item.contentTitle ?? null,
      type: contentType,
    });
  }, [navigation, item.contentId, item.contentType, item.contentTitle]);

  const content = (
    <ItemContainer key={`${item.videoId}-${index}`}>
      {showErrorState && !item.success ? (
        <FailureIcon>X</FailureIcon>
      ) : (
        <PosterContainer>
          <PosterImage width={48} source={posterUrl} borderRadius={4} />
        </PosterContainer>
      )}
      <ContentArea>
        {showErrorState && !item.success ? (
          <>
            <VideoIdText numberOfLines={1}>{item.videoId}</VideoIdText>
            <ErrorText numberOfLines={1}>{item.error || '알 수 없는 오류'}</ErrorText>
          </>
        ) : (
          <>
            <ContentTitle numberOfLines={1}>
              {item.contentTitle || item.videoTitle}
            </ContentTitle>
            <VideoTitle numberOfLines={1}>{item.videoTitle}</VideoTitle>
          </>
        )}
      </ContentArea>
      {isClickable && <ChevronText>{'>'}</ChevronText>}
    </ItemContainer>
  );

  if (isClickable) {
    return (
      <TouchableOpacity
        key={`${item.videoId}-${index}`}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const ItemContainer = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
});

const PosterContainer = styled.View({
  marginRight: 12,
});

const FailureIcon = styled.Text({
  ...textStyles.body1,
  color: colors.red,
  width: 24,
});

const ContentArea = styled.View({
  flex: 1,
});

const ContentTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const VideoTitle = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
  marginTop: 2,
});

const VideoIdText = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
});

const ErrorText = styled.Text({
  ...textStyles.body3,
  color: colors.red,
  marginTop: 2,
});

const ChevronText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
  marginLeft: 8,
});

export const RegistrationResultItem = memo(RegistrationResultItemComponent);
