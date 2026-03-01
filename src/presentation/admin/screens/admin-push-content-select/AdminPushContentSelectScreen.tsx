/**
 * AdminPushContentSelectScreen - 푸시 알림용 콘텐츠/비디오 선택 페이지
 *
 * 전체 검색 또는 유저의 시청기록/찜/평가 목록에서 콘텐츠를 선택합니다.
 * Player 모드에서는 콘텐츠 선택 후 비디오도 선택합니다.
 * 선택 완료 시 'adminPushContentSelected' 이벤트를 emit하고 뒤로 이동합니다.
 */

import { useCallback, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { BasePage } from '@/presentation/components/page';
import { ScreenRouteProp } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { contentApi } from '@/features/content/api/contentApi';
import { adminUserApi, type UserContentItem } from '@/features/admin';
import {
  type PushContentModel,
  type PushVideoModel,
  contentFromDto,
  videoFromDto,
} from './_types/pushContentSelectModel';

// ============================================================================
// Constants
// ============================================================================

/** 선택 완료 이벤트 이름 */
export const PUSH_CONTENT_SELECTED_EVENT = 'adminPushContentSelected';

const SEARCH_ICON_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const BACK_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

type TabType = 'search' | 'history' | 'favorites' | 'ratings';

const TABS: ReadonlyArray<{ readonly key: TabType; readonly label: string }> = [
  { key: 'search', label: '전체 검색' },
  { key: 'history', label: '시청기록' },
  { key: 'favorites', label: '찜' },
  { key: 'ratings', label: '평가' },
] as const;

// ============================================================================
// Types
// ============================================================================

export interface PushContentSelectResult {
  contentId: number;
  contentTitle: string;
  contentType: 'movie' | 'tv';
  videoId?: string;
  videoTitle?: string;
  /** 시청기록에서 선택 시 이어보기 시작 위치 (초) */
  startSeconds?: number;
}

interface SelectedContent {
  contentId: number;
  contentTitle: string;
  contentType: 'movie' | 'tv';
  /** 시청기록에서 선택 시 이어보기 시작 위치 (초) */
  startSeconds?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function AdminPushContentSelectScreen() {
  const route = useRoute<ScreenRouteProp<typeof routePages.adminPushContentSelect>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { userId, mode } = route.params;
  const needsVideoSelection = mode === 'player';

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PushContentModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 유저 콘텐츠 목록 상태
  const [userContents, setUserContents] = useState<UserContentItem[]>([]);
  const [isLoadingUserContents, setIsLoadingUserContents] = useState(false);

  // 비디오 선택 상태
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
  const [videos, setVideos] = useState<PushVideoModel[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 검색 실행
  const handleSearch = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await contentApi.searchContentsKorean(trimmed, 30);
      setSearchResults(results.map(contentFromDto));
    } catch (err) {
      console.error('검색 실패:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search' && searchQuery.trim().length > 0) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, handleSearch]);

  // 탭 변경 시 유저 콘텐츠 로드
  useEffect(() => {
    if (activeTab === 'search') return;

    const loadUserContents = async () => {
      setIsLoadingUserContents(true);
      try {
        let data: UserContentItem[] = [];
        switch (activeTab) {
          case 'history':
            data = await adminUserApi.getUserWatchHistory(userId, 50);
            break;
          case 'favorites':
            data = await adminUserApi.getUserFavorites(userId, 50);
            break;
          case 'ratings':
            data = await adminUserApi.getUserRatings(userId, 50);
            break;
        }
        setUserContents(data);
      } catch (err) {
        console.error('유저 콘텐츠 로드 실패:', err);
        setUserContents([]);
      } finally {
        setIsLoadingUserContents(false);
      }
    };

    loadUserContents();
  }, [activeTab, userId]);

  // 콘텐츠 선택 핸들러
  const handleSelectContent = useCallback(
    async (content: SelectedContent) => {
      if (needsVideoSelection) {
        // 비디오 선택 화면으로 전환
        setSelectedContent(content);
        setIsLoadingVideos(true);
        try {
          const videoList = await contentApi.getVideosByContent(
            content.contentId,
            content.contentType,
          );
          setVideos(videoList.map(videoFromDto));
        } catch (err) {
          console.error('비디오 로드 실패:', err);
          setVideos([]);
        } finally {
          setIsLoadingVideos(false);
        }
      } else {
        // 바로 선택 완료
        const result: PushContentSelectResult = {
          contentId: content.contentId,
          contentTitle: content.contentTitle,
          contentType: content.contentType,
        };
        DeviceEventEmitter.emit(PUSH_CONTENT_SELECTED_EVENT, result);
        navigation.goBack();
      }
    },
    [needsVideoSelection, navigation],
  );

  // 비디오 선택 핸들러
  const handleSelectVideo = useCallback(
    (video: PushVideoModel) => {
      if (!selectedContent) return;
      const result: PushContentSelectResult = {
        contentId: selectedContent.contentId,
        contentTitle: selectedContent.contentTitle,
        contentType: selectedContent.contentType,
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        // 시청기록에서 선택한 경우 이어보기 시작 위치 포함
        ...(selectedContent.startSeconds !== undefined && {
          startSeconds: selectedContent.startSeconds,
        }),
      };
      DeviceEventEmitter.emit(PUSH_CONTENT_SELECTED_EVENT, result);
      navigation.goBack();
    },
    [selectedContent, navigation],
  );

  // 뒤로가기 (비디오 선택에서 콘텐츠 선택으로)
  const handleBackFromVideos = useCallback(() => {
    setSelectedContent(null);
    setVideos([]);
  }, []);

  // 검색 결과 아이템 렌더링
  const renderSearchItem = useCallback(
    ({ item }: { item: PushContentModel }) => (
      <ContentItem
        onPress={() =>
          handleSelectContent({
            contentId: item.contentId,
            contentTitle: item.contentTitle,
            contentType: item.contentType,
          })
        }
      >
        {item.posterPath ? (
          <ContentPoster source={{ uri: `https://image.tmdb.org/t/p/w92${item.posterPath}` }} />
        ) : (
          <ContentPosterPlaceholder />
        )}
        <ContentInfo>
          <ContentTitle numberOfLines={2}>{item.contentTitle}</ContentTitle>
          <ContentMeta>
            {item.contentType === 'movie' ? '영화' : 'TV'} • {item.releaseYear ?? '-'}
          </ContentMeta>
        </ContentInfo>
      </ContentItem>
    ),
    [handleSelectContent],
  );

  // 유저 콘텐츠 아이템 렌더링
  const renderUserContentItem = useCallback(
    ({ item }: { item: UserContentItem }) => (
      <ContentItem
        onPress={() =>
          handleSelectContent({
            contentId: item.contentId,
            contentTitle: item.contentTitle,
            contentType: item.contentType,
            // 시청기록인 경우 진행 시간(초) 전달
            ...(item.progressSeconds !== undefined && { startSeconds: item.progressSeconds }),
          })
        }
      >
        {item.contentPosterPath ? (
          <ContentPoster
            source={{ uri: `https://image.tmdb.org/t/p/w92${item.contentPosterPath}` }}
          />
        ) : (
          <ContentPosterPlaceholder />
        )}
        <ContentInfo>
          <ContentTitle numberOfLines={2}>{item.contentTitle}</ContentTitle>
          <ContentMeta>
            {item.contentType === 'movie' ? '영화' : 'TV'}
            {item.rating !== undefined && ` • ★ ${item.rating.toFixed(1)}`}
            {item.progressPercent !== undefined && ` • ${item.progressPercent}% 시청`}
          </ContentMeta>
        </ContentInfo>
      </ContentItem>
    ),
    [handleSelectContent],
  );

  // 비디오 아이템 렌더링
  const renderVideoItem = useCallback(
    ({ item }: { item: PushVideoModel }) => (
      <VideoItem onPress={() => handleSelectVideo(item)}>
        {item.thumbnailUrl ? (
          <VideoThumbnail source={{ uri: item.thumbnailUrl }} />
        ) : (
          <VideoThumbnailPlaceholder />
        )}
        <VideoInfo>
          <VideoTitle numberOfLines={2}>{item.videoTitle}</VideoTitle>
          <VideoMeta>
            {item.runtime ? `${Math.floor(item.runtime / 60)}분` : '시간 미정'}
            {item.includesEnding && ' • 결말포함'}
            {item.isPrimary && ' • 대표'}
          </VideoMeta>
        </VideoInfo>
      </VideoItem>
    ),
    [handleSelectVideo],
  );

  // 비디오 선택 화면
  if (selectedContent) {
    return (
      <BasePage useSafeArea={false}>
        <Header paddingTop={insets.top}>
          <BackButton onPress={handleBackFromVideos}>
            <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
          </BackButton>
          <HeaderTitle>비디오 선택</HeaderTitle>
          <HeaderSpacer />
        </Header>

        <SelectedContentBanner>
          <BannerText>{selectedContent.contentTitle}</BannerText>
        </SelectedContentBanner>

        {isLoadingVideos ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color={colors.primary} />
          </LoadingContainer>
        ) : videos.length === 0 ? (
          <EmptyContainer>
            <EmptyText>비디오가 없습니다</EmptyText>
          </EmptyContainer>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.videoId}
            renderItem={renderVideoItem}
            contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={8}
          />
        )}
      </BasePage>
    );
  }

  // 콘텐츠 선택 화면
  return (
    <BasePage useSafeArea={false}>
      <Header paddingTop={insets.top}>
        <BackButton onPress={handleGoBack}>
          <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
        </BackButton>
        <HeaderTitle>콘텐츠 선택</HeaderTitle>
        <HeaderSpacer />
      </Header>

      {/* 탭 */}
      <TabContainer>
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            isActive={activeTab === tab.key}
            onPress={() => setActiveTab(tab.key)}
          >
            <TabText isActive={activeTab === tab.key}>{tab.label}</TabText>
          </TabButton>
        ))}
      </TabContainer>

      {/* 검색 입력 (전체 검색 탭일 때만) */}
      {activeTab === 'search' && (
        <SearchContainer>
          <SvgXml xml={SEARCH_ICON_SVG} width={16} height={16} />
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="콘텐츠 검색 (초성 지원)"
            placeholderTextColor={colors.gray03}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </SearchContainer>
      )}

      {/* 콘텐츠 목록 */}
      {activeTab === 'search' ? (
        isSearching ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color={colors.primary} />
          </LoadingContainer>
        ) : searchResults.length === 0 ? (
          <EmptyContainer>
            <EmptyText>
              {searchQuery.trim() ? '검색 결과가 없습니다' : '콘텐츠를 검색해주세요'}
            </EmptyText>
          </EmptyContainer>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `${item.contentType}-${item.contentId}`}
            renderItem={renderSearchItem}
            contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={7}
            initialNumToRender={10}
          />
        )
      ) : isLoadingUserContents ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.primary} />
        </LoadingContainer>
      ) : userContents.length === 0 ? (
        <EmptyContainer>
          <EmptyText>
            {activeTab === 'history' && '시청기록이 없습니다'}
            {activeTab === 'favorites' && '찜한 콘텐츠가 없습니다'}
            {activeTab === 'ratings' && '평가한 콘텐츠가 없습니다'}
          </EmptyText>
        </EmptyContainer>
      ) : (
        <FlatList
          data={userContents}
          keyExtractor={(item) => `${item.contentType}-${item.contentId}`}
          renderItem={renderUserContentItem}
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={7}
          initialNumToRender={10}
        />
      )}
    </BasePage>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Header = styled(View)<{ paddingTop: number }>(({ paddingTop }) => ({
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
  ...textStyles.title1,
  color: colors.white,
  flex: 1,
  textAlign: 'center',
});

const HeaderSpacer = styled(View)({
  width: 32,
});

const TabContainer = styled(View)({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 8,
  backgroundColor: colors.black,
});

interface TabButtonProps {
  isActive: boolean;
}

const TabButton = styled(TouchableOpacity)<TabButtonProps>(({ isActive }) => ({
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  backgroundColor: isActive ? colors.primary : colors.gray05,
  borderRadius: 8,
}));

const TabText = styled.Text<TabButtonProps>(({ isActive }) => ({
  ...textStyles.body2,
  color: isActive ? colors.white : colors.gray02,
  fontWeight: isActive ? '600' : '400',
}));

const SearchContainer = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray05,
  marginHorizontal: 16,
  marginBottom: 12,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 8,
});

const SearchInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  flex: 1,
  paddingVertical: 12,
});

const LoadingContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const EmptyContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
});

const EmptyText = styled.Text({
  ...textStyles.body1,
  color: colors.gray03,
  textAlign: 'center',
});

const ContentItem = styled(TouchableOpacity)({
  flexDirection: 'row',
  padding: 12,
  backgroundColor: colors.gray06,
  borderRadius: 10,
  marginBottom: 8,
  gap: 12,
});

const ContentPoster = styled(Image)({
  width: 50,
  height: 75,
  borderRadius: 6,
  backgroundColor: colors.gray04,
});

const ContentPosterPlaceholder = styled(View)({
  width: 50,
  height: 75,
  borderRadius: 6,
  backgroundColor: colors.gray04,
});

const ContentInfo = styled(View)({
  flex: 1,
  justifyContent: 'center',
});

const ContentTitle = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  marginBottom: 4,
});

const ContentMeta = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const SelectedContentBanner = styled(View)({
  backgroundColor: colors.primary,
  paddingHorizontal: 16,
  paddingVertical: 12,
});

const BannerText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

const VideoItem = styled(TouchableOpacity)({
  flexDirection: 'row',
  padding: 12,
  backgroundColor: colors.gray06,
  borderRadius: 10,
  marginBottom: 8,
  gap: 12,
});

const VideoThumbnail = styled(Image)({
  width: 120,
  height: 68,
  borderRadius: 6,
  backgroundColor: colors.gray04,
});

const VideoThumbnailPlaceholder = styled(View)({
  width: 120,
  height: 68,
  borderRadius: 6,
  backgroundColor: colors.gray04,
});

const VideoInfo = styled(View)({
  flex: 1,
  justifyContent: 'center',
});

const VideoTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  marginBottom: 4,
});

const VideoMeta = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});
