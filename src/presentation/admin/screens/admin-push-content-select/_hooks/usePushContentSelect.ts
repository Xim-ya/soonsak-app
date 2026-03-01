/**
 * usePushContentSelect - 푸시 콘텐츠/비디오 선택 로직 훅
 *
 * 검색, 유저 콘텐츠 로드, 비디오 선택 등 모든 비즈니스 로직을 관리합니다.
 *
 * @example
 * const {
 *   activeTab, setActiveTab,
 *   searchQuery, setSearchQuery, searchResults, isSearching,
 *   userContents, isLoadingUserContents,
 *   selectedContent, videos, isLoadingVideos,
 *   handleGoBack, handleSelectContent, handleSelectVideo, handleBackFromVideos
 * } = usePushContentSelect({ userId, mode });
 */

import { useCallback, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { contentApi } from '@/features/content/api/contentApi';
import { adminUserApi, type UserContentItem } from '@/features/admin';
import {
  type PushContentModel,
  type PushVideoModel,
  contentFromDto,
  videoFromDto,
} from '../_types/pushContentSelectModel';

/** 선택 완료 이벤트 이름 */
export const PUSH_CONTENT_SELECTED_EVENT = 'adminPushContentSelected';

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

type TabType = 'search' | 'history' | 'favorites' | 'ratings';

interface UsePushContentSelectParams {
  userId: string;
  mode: 'content' | 'player';
}

interface UsePushContentSelectReturn {
  // 탭 상태
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // 검색 상태
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: PushContentModel[];
  isSearching: boolean;
  handleSearch: () => Promise<void>;

  // 유저 콘텐츠 상태
  userContents: UserContentItem[];
  isLoadingUserContents: boolean;

  // 비디오 선택 상태
  selectedContent: SelectedContent | null;
  videos: PushVideoModel[];
  isLoadingVideos: boolean;
  needsVideoSelection: boolean;

  // 핸들러
  handleGoBack: () => void;
  handleSelectContent: (content: SelectedContent) => Promise<void>;
  handleSelectVideo: (video: PushVideoModel) => void;
  handleBackFromVideos: () => void;
}

export function usePushContentSelect({
  userId,
  mode,
}: UsePushContentSelectParams): UsePushContentSelectReturn {
  const navigation = useNavigation();
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

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
    userContents,
    isLoadingUserContents,
    selectedContent,
    videos,
    isLoadingVideos,
    needsVideoSelection,
    handleGoBack,
    handleSelectContent,
    handleSelectVideo,
    handleBackFromVideos,
  };
}
