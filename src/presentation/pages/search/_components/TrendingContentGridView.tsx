import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItemInfo, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { useTrendingTopFifteen } from '../_hooks/useTrendingTopFifteen';
import { TrendingContentModel } from '../_types/trendingContentModel';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 그리드 레이아웃 상수 */
const HORIZONTAL_PADDING = 16;
const IMAGE_WIDTH = 240;
const IMAGE_HEIGHT = 134;
const ITEM_GAP_VERTICAL = 10;
const COLUMN_GAP = 18;
const ITEMS_PER_COLUMN = 3;

/** 타이틀 로고 상수 */
const TITLE_LOGO_WIDTH = 100;
const TITLE_LOGO_HEIGHT = 30;

/** 타이틀 텍스트 폰트 크기 (DoHyeon 전용 폰트 사용, textStyles에 미포함) */
const ITEM_TITLE_FONT_SIZE = 18;

/** 플레이 아이콘 폰트 크기 */
const PLAY_ICON_FONT_SIZE = 8;

/** 콘텐츠 타입 라벨 맵 */
const CONTENT_TYPE_LABEL: Record<string, string> = {
  movie: '영화',
  tv: '시리즈',
};

/** 그라데이션 오버레이 색상 (렌더마다 새 배열 생성 방지) */
const GRADIENT_COLORS: [string, string] = ['transparent', 'rgba(0, 0, 0, 0.8)'];

/** 세로로 묶인 아이템 그룹 타입 */
type ColumnGroup = (TrendingContentModel | null)[];

/**
 * 타이틀 영역: 한국어 로고가 있으면 로고, 없으면 텍스트 표시
 */
const TitleWithLogo = React.memo(({ item }: { item: TrendingContentModel }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const hasValidKoreanLogo = item.titleLogo && item.titleLogoLang === 'ko';
  const shouldShowLogo = hasValidKoreanLogo && !hasImageError;

  if (shouldShowLogo) {
    const logoUrl = formatter.prefixTmdbImgUrl(item.titleLogo!, { size: TmdbImageSize.w342 });
    return (
      <TitleLogoImage
        source={{ uri: logoUrl }}
        resizeMode="contain"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <ItemTitle numberOfLines={1} ellipsizeMode="tail">
      {item.title}
    </ItemTitle>
  );
});
TitleWithLogo.displayName = 'TitleWithLogo';

/**
 * 개별 그리드 아이템 컴포넌트
 */
const TrendingGridItem = React.memo(({ item }: { item: TrendingContentModel }) => {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = useCallback(() => {
    navigation.navigate(routePages.contentDetail, {
      id: item.id,
      title: item.title,
      type: item.type,
    });
  }, [navigation, item.id, item.title, item.type]);

  // formatter.prefixTmdbImgUrl은 단순 문자열 변환이므로 useMemo 오버헤드 불필요
  // backdropPath 우선, posterPath fallback, 둘 다 없으면 빈 문자열 (LoadableImageView가 에러 UI 표시)
  const imageSize = item.backdropPath ? TmdbImageSize.w780 : TmdbImageSize.w500;
  const imagePath = item.backdropPath || item.posterPath;
  const imageUrl = imagePath ? formatter.prefixTmdbImgUrl(imagePath, { size: imageSize }) : '';

  const typeLabel = CONTENT_TYPE_LABEL[item.type] ?? item.type;

  return (
    <ItemContainer>
      <ItemTouchable onPress={handlePress} activeOpacity={0.8}>
        <ImageWrapper>
          <LoadableImageView
            source={imageUrl}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            borderRadius={6}
          />
          {/* 하단 그라데이션 오버레이 */}
          <GradientOverlay colors={GRADIENT_COLORS} />
          {/* 콘텐츠 타입 뱃지 */}
          <TypeBadge>
            <PlayIcon>▶</PlayIcon>
            <TypeText>{typeLabel}</TypeText>
          </TypeBadge>
          {/* 우측 하단 타이틀/로고 */}
          <TitleContainer>
            <TitleWithLogo item={item} />
          </TitleContainer>
        </ImageWrapper>
      </ItemTouchable>
      {/* 순위 번호 - 이미지 왼쪽 하단에 겹쳐서 표시 */}
      <RankText>{item.rank}</RankText>
    </ItemContainer>
  );
});
TrendingGridItem.displayName = 'TrendingGridItem';

/**
 * 스켈레톤 아이템 컴포넌트
 */
const TrendingGridSkeletonItem = React.memo(({ rank }: { rank: number }) => (
  <ItemContainer>
    <SkeletonBox />
    <RankText>{rank}</RankText>
  </ItemContainer>
));
TrendingGridSkeletonItem.displayName = 'TrendingGridSkeletonItem';

/**
 * 세로 컬럼 그룹 컴포넌트 (3개 아이템을 세로로 배치)
 */
const ColumnGroupView = React.memo(
  ({ items, startRank }: { items: ColumnGroup; startRank: number }) => (
    <ColumnContainer>
      {items.map((item, index) => (
        <React.Fragment key={item?.rank ?? `skeleton-${startRank + index}`}>
          {item ? (
            <TrendingGridItem item={item} />
          ) : (
            <TrendingGridSkeletonItem rank={startRank + index} />
          )}
          {index < items.length - 1 && <Gap size={ITEM_GAP_VERTICAL} />}
        </React.Fragment>
      ))}
    </ColumnContainer>
  ),
);
ColumnGroupView.displayName = 'ColumnGroupView';

/**
 * 지금 뜨는 콘텐츠 그리드 뷰
 * 검색 화면 초기 상태에서 표시되는 인기 콘텐츠 (가로 스크롤, 세로 3개씩 그룹)
 */
function TrendingContentGridView() {
  const { data: trendingContents, isLoading, isError } = useTrendingTopFifteen();

  /** 세로 3개씩 그룹화된 데이터 */
  const columnGroups: ColumnGroup[] = useMemo(() => {
    if (isLoading) {
      // 스켈레톤: 5컬럼 x 3아이템 = 15개
      return Array.from({ length: 5 }, () => Array.from({ length: ITEMS_PER_COLUMN }, () => null));
    }

    if (!trendingContents || trendingContents.length === 0) return [];

    const groups: ColumnGroup[] = [];
    for (let i = 0; i < trendingContents.length; i += ITEMS_PER_COLUMN) {
      groups.push(trendingContents.slice(i, i + ITEMS_PER_COLUMN));
    }
    return groups;
  }, [trendingContents, isLoading]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ColumnGroup>) => (
      <ColumnGroupView items={item} startRank={index * ITEMS_PER_COLUMN + 1} />
    ),
    [],
  );

  // Early return 조건: 에러 또는 데이터 없음
  const hasError = isError;
  const hasNoDataAfterLoad = !isLoading && columnGroups.length === 0;
  const shouldHideComponent = hasError || hasNoDataAfterLoad;

  if (shouldHideComponent) return null;

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>지금 뜨고 있는 인기 작품</SectionTitle>
        <InfoIcon>ⓘ</InfoIcon>
      </SectionHeader>
      <Gap size={12} />
      <FlatList
        horizontal
        data={columnGroups}
        renderItem={renderItem}
        keyExtractor={columnGroupKeyExtractor}
        ItemSeparatorComponent={ColumnSeparator}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={LIST_CONTENT_STYLE}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={3}
      />
    </Container>
  );
}

const LIST_CONTENT_STYLE = { paddingHorizontal: HORIZONTAL_PADDING };

/**
 * FlatList keyExtractor - 컴포넌트 외부 상수 함수로 정의하여
 * 렌더마다 새 함수가 생성되지 않도록 보장
 */
const columnGroupKeyExtractor = (_: ColumnGroup, index: number) => `trending-column-${index}`;

/**
 * FlatList ItemSeparatorComponent - React.memo로 감싸서 불필요한 리렌더 방지
 */
const ColumnSeparator = React.memo(() => <Gap size={COLUMN_GAP} />);
ColumnSeparator.displayName = 'ColumnSeparator';

/* Styled Components */

const Container = styled.View({
  marginTop: 16,
});

const SectionHeader = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: HORIZONTAL_PADDING,
});

const SectionTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const InfoIcon = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  marginLeft: 6,
});

const ColumnContainer = styled.View({
  flexDirection: 'column',
});

const ItemContainer = styled.View({
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  position: 'relative',
});

const ItemTouchable = styled(TouchableOpacity)({
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
});

const ImageWrapper = styled.View({
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  borderRadius: 6,
  overflow: 'hidden',
  position: 'relative',
});

const RankText = styled.Text({
  ...textStyles.web2,
  color: colors.white,
  position: 'absolute',
  left: -8,
  bottom: -8,
  textShadowColor: 'rgba(0, 0, 0, 0.9)',
  textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 8,
});

const TypeBadge = styled.View({
  position: 'absolute',
  top: 8,
  left: 8,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
});

const PlayIcon = styled.Text({
  fontSize: PLAY_ICON_FONT_SIZE,
  color: colors.main,
  marginRight: 4,
});

const TypeText = styled.Text({
  ...textStyles.desc,
  color: colors.white,
});

const GradientOverlay = styled(LinearGradient)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '50%',
  borderBottomLeftRadius: 6,
  borderBottomRightRadius: 6,
});

const TitleContainer = styled.View({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 8,
  alignItems: 'center',
});

const ItemTitle = styled.Text({
  fontSize: ITEM_TITLE_FONT_SIZE,
  fontFamily: 'DoHyeon-Regular',
  color: colors.white,
  textAlign: 'center',
});

const TitleLogoImage = styled(Image)({
  width: TITLE_LOGO_WIDTH,
  height: TITLE_LOGO_HEIGHT,
});

const SkeletonBox = styled.View({
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  borderRadius: 6,
  backgroundColor: colors.gray05,
});

export { TrendingContentGridView };
