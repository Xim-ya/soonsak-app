import styled from '@emotion/native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import ContentTypeChip from '@/presentation/components/chip/ContentTypeChip';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { ChannelVideoModel } from '../_types';

interface VideoGridItemProps {
  video: ChannelVideoModel;
}

const ITEM_WIDTH = (AppSize.screenWidth - 32 - 18) / 3;
const POSTER_HEIGHT = ITEM_WIDTH * (165 / 109);

export function VideoGridItem({ video }: VideoGridItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const posterUrl = formatter.prefixTmdbImgUrl(video.contentPosterPath, {
    size: TmdbImageSize.w342,
  });

  const handlePress = () => {
    navigation.navigate(routePages.contentDetail, {
      id: video.contentId,
      title: video.contentTitle,
      type: video.contentType,
      videoId: video.id,
    });
  };

  return (
    <Container>
      <Pressable onPress={handlePress}>
        <PosterWrapper>
          <LoadableImageView
            source={posterUrl}
            width={ITEM_WIDTH}
            height={POSTER_HEIGHT}
            borderRadius={4}
          />
          <ChipWrapper>
            <ContentTypeChip contentType={video.contentType} />
          </ChipWrapper>
        </PosterWrapper>
        <TitleWrapper>
          <ContentTitle numberOfLines={2}>{video.contentTitle || '내용 없음'}</ContentTitle>
        </TitleWrapper>
      </Pressable>
    </Container>
  );
}

const Container = styled.View({
  width: ITEM_WIDTH,
  marginBottom: 24,
});

const PosterWrapper = styled.View({
  position: 'relative',
});

const ChipWrapper = styled.View({
  position: 'absolute',
  left: 5,
  top: 6,
});

const TitleWrapper = styled.View({
  marginTop: 8,
  height: 28,
});

const ContentTitle = styled.Text({
  ...textStyles.desc,
  color: colors.gray01,
  lineHeight: 14,
});
