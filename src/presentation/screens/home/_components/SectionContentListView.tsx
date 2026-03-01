import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  TouchableHighlight,
  View,
} from 'react-native';
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
import { PosterImage, PosterSkeleton } from '@/presentation/components/image/PosterImage';

interface SectionContentListViewProps {
  title: string | null;
  contents: BaseContentModel[] | null;
  onContentTapped?: (content: BaseContentModel) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onTitlePress?: () => void;
}

/** 스켈레톤 아이템 개수 */
const SKELETON_COUNT = 6;

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
  isLoading = false,
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
          <PosterImage
            width={POSTER_WIDTH}
            source={formatter.prefixTmdbImgUrl(item.posterPath, {
              size: TmdbImageSize.w500,
            })}
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

  // 아이템 레이아웃 계산 (스크롤 성능 최적화)
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: POSTER_WIDTH,
      offset: (POSTER_WIDTH + SEPARATOR_WIDTH) * index,
      index,
    }),
    [],
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
      {isLoading ? (
        <SkeletonList />
      ) : (
        (contents?.length ?? 0) > 0 && (
          <FlatList
            horizontal
            data={contents}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={ItemSeparator}
            ListFooterComponent={ListFooter}
            getItemLayout={getItemLayout}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            removeClippedSubviews
            maxToRenderPerBatch={6}
            windowSize={5}
            initialNumToRender={6}
          />
        )
      )}
    </Container>
  );
}

/** 스켈레톤 리스트 (API 로딩 중 표시) */
function SkeletonList() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <View key={`skeleton-${index}`} style={{ marginRight: SEPARATOR_WIDTH }}>
          <PosterItem>
            <PosterSkeleton width={POSTER_WIDTH} />
            <Gap size={4} />
            <SkeletonTitle />
          </PosterItem>
        </View>
      ))}
    </ScrollView>
  );
}

/* VARIABLES */
const POSTER_WIDTH = 110;
const POSTER_HEIGHT = 165;
const SEPARATOR_WIDTH = 8;

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

const PosterItem = styled.View({
  width: POSTER_WIDTH,
});

const SkeletonTitle = styled.View({
  width: POSTER_WIDTH * 0.8,
  height: 14,
  backgroundColor: colors.gray05,
  borderRadius: 4,
});

export { SectionContentListViewProps, SectionContentListView };
