import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, TouchableHighlight, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import appTextStyle from '@/shared/styles/textStyles';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

interface SectionContentListViewProps {
  title: string | null;
  contents: BaseContentModel[] | null;
  onContentTapped: (content: BaseContentModel) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  onTitlePress?: () => void;
}

/**
 * 제목과 콘텐츠 리스트로 구성된 리스트뷰
 * @param title 섹션 제목 (하드코딩된 값을 전달 받는 경우도 존재)
 * @param contents 콘텐츠 리스트
 */

function SectionContentListView({
  title,
  contents,
  onContentTapped: onItemPress,
  onEndReached,
  isFetchingNextPage = false,
  onTitlePress,
}: SectionContentListViewProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleContentPress = useCallback(
    (content: BaseContentModel) => {
      if (onItemPress) {
        onItemPress(content);
      } else {
        navigation.navigate(routePages.contentDetail, {
          id: content.id,
          type: content.type,
        });
      }
    },
    [onItemPress, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: BaseContentModel }) => (
      <TouchableHighlight onPress={() => handleContentPress(item)}>
        <PosterItem>
          <PosterImg
            source={{
              uri: formatter.prefixTmdbImgUrl(item.posterPath, {
                size: TmdbImageSize.w500,
              }),
            }}
          />
          <Gap size={4} />
          <ContentTitle numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </ContentTitle>
        </PosterItem>
      </TouchableHighlight>
    ),
    [handleContentPress],
  );

  const keyExtractor = useCallback((item: BaseContentModel) => `${item.id}-${item.type}`, []);

  const ItemSeparator = useCallback(() => <Gap size={8} />, []);

  const ListFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View
          style={{
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
          }}
        >
          <ActivityIndicator size="small" color={colors.white} />
        </View>
      ) : null,
    [isFetchingNextPage],
  );

  return (
    <Container>
      {title != null && (
        <Pressable onPress={onTitlePress} disabled={!onTitlePress}>
          <TitleRow>
            <SectionTitle>{title}</SectionTitle>
            {onTitlePress && <RightArrowIcon width={20} height={20} />}
          </TitleRow>
        </Pressable>
      )}

      <Gap size={8} />
      {(contents?.length ?? 0) > 0 && (
        <FlatList
          horizontal
          data={contents}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          ListFooterComponent={ListFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={5}
          initialNumToRender={6}
        />
      )}
    </Container>
  );
}

/* VARIABLES */
const POSTER_WIDTH = 92;
const POSTER_HEIGHT = 140;
const posterRatio = POSTER_WIDTH / POSTER_HEIGHT;

const Container = styled.View({
  marginTop: 32,
  paddingLeft: 16,
});

const TitleRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: 16,
});

const SectionTitle = styled.Text({
  ...appTextStyle.title2,
  color: colors.white,
});

const ContentTitle = styled.Text({
  ...appTextStyle.body3,
  color: colors.white,
});

const PosterImg = styled.Image({
  aspectRatio: posterRatio,
  alignSelf: 'stretch',
});

const PosterItem = styled.View({
  width: POSTER_WIDTH,
});

export { SectionContentListViewProps, SectionContentListView };
