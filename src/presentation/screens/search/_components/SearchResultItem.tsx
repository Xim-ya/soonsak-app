import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import { formatter, TmdbImageSize } from '@/core/utils/formatter';
import { RootStackParamList } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import { ContentSource, analyticsService } from '@/core/services/analytics';
import { contentTypeConfigs } from '@/core/types/content/contentType.enum';
import { SearchResultModel } from '../_types/searchResultModel';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 포스터 비율 (2:3) */
const POSTER_ASPECT_RATIO = 1.5;

// 포스터 크기 (비율 기반 반응형)
const POSTER_WIDTH = AppSize.ratioWidth(79);
const POSTER_HEIGHT = POSTER_WIDTH * POSTER_ASPECT_RATIO;
const ITEM_PADDING = 16;

interface SearchResultItemProps {
  readonly item: SearchResultModel;
  readonly position: number;
  readonly searchTerm: string;
}

/**
 * SearchResultItem - 검색 결과 아이템 컴포넌트
 *
 * 포스터 이미지, 제목, 콘텐츠 타입, 개봉년도를 표시합니다.
 * 클릭 시 콘텐츠 상세 화면으로 이동합니다.
 */
const SearchResultItem = memo(function SearchResultItem({
  item,
  position,
  searchTerm,
}: SearchResultItemProps) {
  const navigation = useNavigation<NavigationProp>();

  // initialData로 포스터 경로를 전달하여 API 응답 전에 즉시 표시
  const handlePress = useCallback(() => {
    // search_result_click 이벤트 로깅
    analyticsService.searchResultClick({
      search_term: searchTerm,
      content_id: item.id,
      content_type: item.contentType,
      position,
    });

    navigation.navigate(routePages.contentDetail, {
      id: item.id,
      title: item.title,
      type: item.contentType,
      source: ContentSource.SEARCH_RESULT,
      ...(item.posterPath && {
        initialData: { posterPath: item.posterPath },
      }),
    });
  }, [navigation, item.id, item.title, item.contentType, item.posterPath, position, searchTerm]);

  // 포스터 이미지 URL 생성
  const posterUrl = item.posterPath
    ? formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w185 })
    : '';

  // 콘텐츠 타입 라벨
  const typeLabel = contentTypeConfigs[item.contentType].label;

  // 메타 정보 텍스트 (타입 · 년도)
  const metaText = item.releaseYear ? `${typeLabel} · ${item.releaseYear}` : typeLabel;

  return (
    <Container onPress={handlePress} activeOpacity={0.7}>
      <LoadableImageView
        source={posterUrl}
        width={POSTER_WIDTH}
        height={POSTER_HEIGHT}
        borderRadius={4}
      />
      <Gap size={12} />
      <InfoContainer>
        <Title numberOfLines={2}>{item.title}</Title>
        <Gap size={4} />
        <MetaText>{metaText}</MetaText>
      </InfoContainer>
    </Container>
  );
});

/* Styled Components */
const Container = styled(TouchableOpacity)({
  flexDirection: 'row',
  paddingHorizontal: ITEM_PADDING,
  paddingVertical: 12,
});

const InfoContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
});

const Title = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const MetaText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

export { SearchResultItem };
