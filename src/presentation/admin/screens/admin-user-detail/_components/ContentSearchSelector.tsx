/**
 * ContentSearchSelector - 콘텐츠/비디오 검색 선택 모달
 *
 * 전체 검색 또는 유저의 시청기록/찜/평가 목록에서 콘텐츠를 선택할 수 있습니다.
 * Player 액션의 경우 비디오도 선택할 수 있습니다.
 */

import { memo, useCallback, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { AdminLogger } from '@/shared/utils/logger';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { contentApi } from '@/features/content/api/contentApi';
import { adminUserApi, type UserContentItem } from '@/features/admin';
import {
  contentSearchFromDto,
  videoSearchFromDto,
  type ContentSearchModel as ContentModel,
  type VideoSearchModel as VideoModel,
} from '../_types/contentSearchModel';

// ============================================================================
// Constants
// ============================================================================

const SEARCH_ICON_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const BACK_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

type TabType = 'search' | 'history' | 'favorites' | 'ratings';

const TABS: { key: TabType; label: string }[] = [
  { key: 'search', label: '전체 검색' },
  { key: 'history', label: '시청기록' },
  { key: 'favorites', label: '찜' },
  { key: 'ratings', label: '평가' },
];

// ============================================================================
// Types
// ============================================================================

export interface SelectedContent {
  contentId: number;
  contentTitle: string;
  contentType: 'movie' | 'tv';
}

export interface SelectedVideo {
  videoId: string;
  videoTitle: string;
}

interface ContentSearchSelectorProps {
  /** 현재 보고 있는 유저 ID */
  readonly userId: string;
  /** 비디오 선택 필요 여부 (Player 액션 등) */
  readonly needsVideoSelection?: boolean;
  /** 콘텐츠 선택 완료 콜백 */
  readonly onSelectContent: (content: SelectedContent, video?: SelectedVideo) => void;
  /** 뒤로가기/닫기 콜백 */
  readonly onBack: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ContentSearchSelector = memo(function ContentSearchSelector({
  userId,
  needsVideoSelection = false,
  onSelectContent,
  onBack,
}: ContentSearchSelectorProps) {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContentModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 유저 콘텐츠 목록 상태
  const [userContents, setUserContents] = useState<UserContentItem[]>([]);
  const [isLoadingUserContents, setIsLoadingUserContents] = useState(false);

  // 비디오 선택 상태
  const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
  const [videos, setVideos] = useState<VideoModel[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

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
      // DTO를 Model로 변환
      const models = results.map(contentSearchFromDto);
      setSearchResults(models);
    } catch (err) {
      AdminLogger.error('검색 실패:', err);
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
        AdminLogger.error('유저 콘텐츠 로드 실패:', err);
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
          // DTO를 Model로 변환
          const models = videoList.map(videoSearchFromDto);
          setVideos(models);
        } catch (err) {
          AdminLogger.error('비디오 로드 실패:', err);
          setVideos([]);
        } finally {
          setIsLoadingVideos(false);
        }
      } else {
        // 바로 선택 완료
        onSelectContent(content);
      }
    },
    [needsVideoSelection, onSelectContent],
  );

  // 비디오 선택 핸들러
  const handleSelectVideo = useCallback(
    (video: VideoModel) => {
      if (!selectedContent) return;
      onSelectContent(selectedContent, {
        videoId: video.id,
        videoTitle: video.title,
      });
    },
    [selectedContent, onSelectContent],
  );

  // 뒤로가기 (비디오 선택에서 콘텐츠 선택으로)
  const handleBackFromVideos = useCallback(() => {
    setSelectedContent(null);
    setVideos([]);
  }, []);

  // 검색 결과 아이템 렌더링
  const renderSearchItem = useCallback(
    ({ item }: { item: ContentModel }) => (
      <ContentItem
        onPress={() =>
          handleSelectContent({
            contentId: item.id,
            contentTitle: item.title,
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
          <ContentTitle numberOfLines={2}>{item.title}</ContentTitle>
          <ContentMeta>
            {item.contentType === 'movie' ? '영화' : 'TV'} • {item.releaseDate?.slice(0, 4) ?? '-'}
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
    ({ item }: { item: VideoModel }) => (
      <VideoItem onPress={() => handleSelectVideo(item)}>
        {item.thumbnailUrl ? (
          <VideoThumbnail source={{ uri: item.thumbnailUrl }} />
        ) : (
          <VideoThumbnailPlaceholder />
        )}
        <VideoInfo>
          <VideoTitle numberOfLines={2}>{item.title}</VideoTitle>
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
      <Container>
        <Header>
          <BackButton onPress={handleBackFromVideos}>
            <SvgXml xml={BACK_ICON_SVG} width={20} height={20} />
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
            <EmptyText>비디오가 없어요</EmptyText>
          </EmptyContainer>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Container>
    );
  }

  // 콘텐츠 선택 화면
  return (
    <Container>
      <Header>
        <BackButton onPress={onBack}>
          <SvgXml xml={BACK_ICON_SVG} width={20} height={20} />
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
              {searchQuery.trim() ? '검색 결과가 없어요' : '콘텐츠를 검색해주세요'}
            </EmptyText>
          </EmptyContainer>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `${item.contentType}-${item.id}`}
            renderItem={renderSearchItem}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : isLoadingUserContents ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.primary} />
        </LoadingContainer>
      ) : userContents.length === 0 ? (
        <EmptyContainer>
          <EmptyText>
            {activeTab === 'history' && '시청기록이 없어요'}
            {activeTab === 'favorites' && '찜한 콘텐츠가 없어요'}
            {activeTab === 'ratings' && '평가한 콘텐츠가 없어요'}
          </EmptyText>
        </EmptyContainer>
      ) : (
        <FlatList
          data={userContents}
          keyExtractor={(item) => `${item.contentType}-${item.contentId}`}
          renderItem={renderUserContentItem}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Container>
  );
});

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(View)({
  flex: 1,
  backgroundColor: colors.gray06,
});

const Header = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

const BackButton = styled(TouchableOpacity)({
  padding: 4,
});

const HeaderTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
  flex: 1,
  textAlign: 'center',
});

const HeaderSpacer = styled(View)({
  width: 28,
});

const TabContainer = styled(View)({
  flexDirection: 'row',
  paddingHorizontal: 12,
  paddingVertical: 8,
  gap: 8,
});

interface TabButtonProps {
  isActive: boolean;
}

const TabButton = styled(TouchableOpacity)<TabButtonProps>(({ isActive }) => ({
  flex: 1,
  paddingVertical: 8,
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
  marginHorizontal: 12,
  marginVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 8,
});

const SearchInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  flex: 1,
  paddingVertical: 10,
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
  backgroundColor: colors.gray05,
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
  paddingVertical: 10,
});

const BannerText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

const VideoItem = styled(TouchableOpacity)({
  flexDirection: 'row',
  padding: 12,
  backgroundColor: colors.gray05,
  borderRadius: 10,
  marginBottom: 8,
  gap: 12,
});

const VideoThumbnail = styled(Image)({
  width: 100,
  height: 56,
  borderRadius: 6,
  backgroundColor: colors.gray04,
});

const VideoThumbnailPlaceholder = styled(View)({
  width: 100,
  height: 56,
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
