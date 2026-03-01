/**
 * AdminContentSearchScreen - 어드민 콘텐츠 검색/교체 페이지
 *
 * 비디오가 잘못된 콘텐츠에 매핑되었을 때 올바른 콘텐츠로 교체하는 화면
 * TMDB 검색 API를 사용하여 콘텐츠 검색
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useDialog } from '@/presentation/components/dialog';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { ScreenRouteProp, RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { tmdbApi } from '@/features/tmdb/api/tmdbApi';
import { adminContentApi } from '@/features/admin/api';
import type { SearchMultiItemDto } from '@/features/tmdb/types/common';
import { contentTypeConfigs, ContentType } from '@/presentation/types/content/contentType.enum';
import { useDebounce } from '@/shared/hooks/useDebounce';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** TMDB 검색 결과에서 movie/tv만 필터링한 타입 */
type TmdbContentItem = SearchMultiItemDto & { mediaType: 'movie' | 'tv' };

const ICON_SIZE = 20;
const INPUT_HEIGHT = 44;
const POSTER_ASPECT_RATIO = 1.5;
const POSTER_WIDTH = AppSize.ratioWidth(79);
const POSTER_HEIGHT = POSTER_WIDTH * POSTER_ASPECT_RATIO;
const DEBOUNCE_DELAY = 350;
const STALE_TIME_MS = 1000 * 60 * 5;

// 검색 아이콘 SVG
const searchIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// X 아이콘 SVG
const clearIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6L6 18M6 6L18 18" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 뒤로가기 아이콘 SVG
const backIconSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/** TMDB mediaType을 앱의 ContentType으로 변환 */
function toContentType(mediaType: 'movie' | 'tv'): ContentType {
  return mediaType === 'movie' ? 'movie' : 'tv';
}

/** TMDB 검색 결과에서 제목 추출 */
function getTitle(item: TmdbContentItem): string {
  return item.mediaType === 'movie' ? (item.title ?? '') : (item.name ?? '');
}

/** TMDB 검색 결과에서 개봉/방영 연도 추출 */
function getReleaseYear(item: TmdbContentItem): string | null {
  const dateStr = item.mediaType === 'movie' ? item.releaseDate : item.firstAirDate;
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear().toString();
}

export default function AdminContentSearchScreen() {
  const route = useRoute<ScreenRouteProp<typeof routePages.adminContentSearch>>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showDialog, showConfirmDialog } = useDialog();

  const {
    videoId,
    videoTitle,
    currentContentId,
    currentContentType,
    currentContentTitle,
    currentContentReleaseYear,
  } = route.params;

  const [searchText, setSearchText] = useState('');
  const [isRemapping, setIsRemapping] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const debouncedQuery = useDebounce(searchText, DEBOUNCE_DELAY);

  // 컴포넌트 마운트 시 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // TMDB 검색 쿼리
  const { data: searchResults, isLoading } = useQuery<TmdbContentItem[], Error>({
    queryKey: ['tmdbSearch', debouncedQuery],
    queryFn: async () => {
      const response = await tmdbApi.searchMulti(debouncedQuery);
      // person 타입 제외, movie/tv만 필터링
      return response.data.results.filter(
        (item): item is TmdbContentItem => item.mediaType === 'movie' || item.mediaType === 'tv',
      );
    },
    enabled: debouncedQuery.trim().length > 0,
    staleTime: STALE_TIME_MS,
  });

  const handleClear = useCallback(() => {
    setSearchText('');
    inputRef.current?.focus();
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 콘텐츠 선택 시 확인 다이얼로그
  const handleSelectContent = useCallback(
    async (selectedItem: TmdbContentItem) => {
      Keyboard.dismiss();

      const newContentType = toContentType(selectedItem.mediaType);
      const title = getTitle(selectedItem);

      // 동일한 콘텐츠 선택 방지
      if (selectedItem.id === currentContentId && newContentType === currentContentType) {
        await showDialog({
          title: '알림',
          description: '현재 매핑된 콘텐츠와 동일합니다.',
          buttonText: '확인',
        });
        return;
      }

      const result = await showConfirmDialog({
        title: '콘텐츠 교체',
        description: `"${videoTitle}"을(를)\n"${title}"(으)로 교체하시겠습니까?`,
        leftButtonText: '취소',
        rightButtonText: '교체',
      });
      if (result === 'right') {
        handleRemap(selectedItem);
      }
    },
    [videoTitle, currentContentId, currentContentType, showDialog, showConfirmDialog],
  );

  // 실제 재매핑 처리
  const handleRemap = useCallback(
    async (selectedItem: TmdbContentItem) => {
      setIsRemapping(true);

      const newContentType = toContentType(selectedItem.mediaType);
      const title = getTitle(selectedItem);

      try {
        const result = await adminContentApi.remapVideoContent(
          videoId,
          currentContentId,
          currentContentType,
          selectedItem.id,
          newContentType,
        );

        // 캐시 무효화
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['videos', currentContentId, currentContentType],
          }),
          queryClient.invalidateQueries({
            queryKey: ['videos', selectedItem.id, newContentType],
          }),
          queryClient.invalidateQueries({
            queryKey: ['contentDetail', currentContentId, currentContentType],
          }),
          queryClient.invalidateQueries({
            queryKey: ['contentDetail', selectedItem.id, newContentType],
          }),
        ]);

        let message = '교체 완료!';
        if (result.newContentCreated && result.oldContentDeleted) {
          message = '교체 완료!\n새 콘텐츠가 생성되었고, 기존 콘텐츠는 삭제되었습니다.';
        } else if (result.newContentCreated) {
          message = '교체 완료!\n새 콘텐츠가 DB에 생성되었습니다.';
        } else if (result.oldContentDeleted) {
          message = '교체 완료!\n기존 콘텐츠는 다른 비디오가 없어 삭제되었습니다.';
        }

        const dialogResult = await showDialog({
          title: '완료',
          description: message,
          buttonText: '확인',
        });
        if (dialogResult === 'confirm') {
          // 새 콘텐츠 상세 페이지로 이동
          navigation.replace(routePages.contentDetail, {
            id: selectedItem.id,
            type: newContentType,
            title,
            videoId,
          });
        }
      } catch (error) {
        console.error('콘텐츠 교체 실패:', error);
        await showDialog({
          title: '오류',
          description: '콘텐츠 교체에 실패했습니다. 다시 시도해주세요.',
          buttonText: '확인',
        });
      } finally {
        setIsRemapping(false);
      }
    },
    [videoId, currentContentId, currentContentType, queryClient, navigation, showDialog],
  );

  const renderItem = useCallback(
    ({ item }: { item: TmdbContentItem }) => (
      <ContentResultItem item={item} onPress={handleSelectContent} />
    ),
    [handleSelectContent],
  );

  const keyExtractor = useCallback((item: TmdbContentItem) => `${item.mediaType}-${item.id}`, []);

  const hasText = searchText.length > 0;
  const showEmptyState =
    debouncedQuery.trim().length > 0 && !isLoading && (searchResults?.length ?? 0) === 0;

  return (
    <BasePage useSafeArea={false}>
      {/* 로딩 오버레이 */}
      {isRemapping && (
        <LoadingOverlay>
          <ActivityIndicator size="large" color={colors.primary} />
          <LoadingText>교체 중...</LoadingText>
        </LoadingOverlay>
      )}

      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={backIconSvg} width={24} height={24} />
        </BackButton>
        <HeaderTitle>콘텐츠 교체</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 현재 콘텐츠 정보 */}
      <VideoInfoContainer>
        <VideoInfoLabel>현재 콘텐츠</VideoInfoLabel>
        <VideoInfoTitle numberOfLines={1}>
          {currentContentTitle}
          {currentContentReleaseYear && ` (${currentContentReleaseYear})`}
        </VideoInfoTitle>
      </VideoInfoContainer>

      {/* 검색 바 */}
      <SearchBarContainer>
        <SearchIconWrapper>
          <SvgXml xml={searchIconSvg} width={ICON_SIZE} height={ICON_SIZE} />
        </SearchIconWrapper>
        <SearchInput
          ref={inputRef}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="TMDB에서 콘텐츠 검색"
          placeholderTextColor={colors.gray02}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {hasText && (
          <ClearButton onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <SvgXml xml={clearIconSvg} width={ICON_SIZE} height={ICON_SIZE} />
          </ClearButton>
        )}
      </SearchBarContainer>

      {/* 검색 결과 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="small" color={colors.gray02} />
        </LoadingContainer>
      ) : showEmptyState ? (
        <EmptyStateContainer>
          <EmptyStateText>검색 결과가 없습니다</EmptyStateText>
        </EmptyStateContainer>
      ) : (
        <FlatList
          data={searchResults ?? []}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </BasePage>
  );
}

/* Content Result Item */
interface ContentResultItemProps {
  readonly item: TmdbContentItem;
  readonly onPress: (item: TmdbContentItem) => void;
}

const ContentResultItem = memo(function ContentResultItem({
  item,
  onPress,
}: ContentResultItemProps) {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const posterUrl = item.posterPath
    ? formatter.prefixTmdbImgUrl(item.posterPath, { size: TmdbImageSize.w185 })
    : '';

  const contentType = toContentType(item.mediaType);
  const typeLabel = contentTypeConfigs[contentType].label;
  const title = getTitle(item);
  const releaseYear = getReleaseYear(item);
  const metaText = releaseYear ? `${typeLabel} · ${releaseYear}` : typeLabel;

  return (
    <ItemContainer onPress={handlePress} activeOpacity={0.7}>
      <LoadableImageView
        source={posterUrl}
        width={POSTER_WIDTH}
        height={POSTER_HEIGHT}
        borderRadius={4}
      />
      <Gap size={12} />
      <ItemInfoContainer>
        <ItemTitle numberOfLines={2}>{title}</ItemTitle>
        <Gap size={4} />
        <ItemMetaText>{metaText}</ItemMetaText>
      </ItemInfoContainer>
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

const VideoInfoContainer = styled.View({
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.gray06,
  marginHorizontal: 16,
  marginBottom: 12,
  borderRadius: 8,
});

const VideoInfoLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginBottom: 4,
});

const VideoInfoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const SearchBarContainer = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray05,
  borderRadius: 8,
  marginHorizontal: 16,
  marginBottom: 12,
  paddingHorizontal: 12,
  height: INPUT_HEIGHT,
});

const SearchIconWrapper = styled.View({
  marginRight: 8,
});

const SearchInput = styled.TextInput({
  flex: 1,
  ...textStyles.body2,
  color: colors.white,
  padding: 0,
});

const ClearButton = styled(TouchableOpacity)({
  marginLeft: 8,
  padding: 4,
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const EmptyStateContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const EmptyStateText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});

const ItemContainer = styled(TouchableOpacity)({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 12,
});

const ItemInfoContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
});

const ItemTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const ItemMetaText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

const LoadingOverlay = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
});

const LoadingText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  marginTop: 12,
});
