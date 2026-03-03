/**
 * WatchHistoryProvider - 시청 기록 화면 Context Provider
 *
 * 시청 기록 화면에서 사용되는 상태와 액션을 관리합니다.
 * - viewMode: 카드 뷰/리스트 뷰 모드
 * - items: 시청 기록 목록
 * - 로딩/페이징 상태
 * - 아이템 클릭 핸들러
 *
 * @example
 * <WatchHistoryProvider date={date}>
 *   <WatchHistoryContent />
 * </WatchHistoryProvider>
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { ContentSource, analyticsService } from '@/shared/analytics';
import {
  useWatchHistoryByDate,
  useInfiniteUniqueWatchHistory,
  type WatchHistoryModelType,
} from '@/features/watch-history';
import type { ViewMode } from '@/presentation/components/view-mode';

/* Types */

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WatchHistoryContextType {
  /** 현재 뷰 모드 (card/list) */
  readonly viewMode: ViewMode;
  /** 뷰 모드 변경 핸들러 */
  readonly setViewMode: (mode: ViewMode) => void;
  /** 시청 기록 아이템 목록 */
  readonly items: readonly WatchHistoryModelType[];
  /** 초기 로딩 중 여부 */
  readonly isInitialLoading: boolean;
  /** 다음 페이지 로딩 중 여부 */
  readonly isFetchingNextPage: boolean;
  /** 다음 페이지 존재 여부 */
  readonly hasNextPage: boolean;
  /** 특정 날짜 조회 모드 여부 */
  readonly isDateMode: boolean;
  /** 조회 대상 날짜 (날짜 모드인 경우) */
  readonly date: string | undefined;
  /** 아이템 클릭 핸들러 */
  readonly handleItemPress: (item: WatchHistoryModelType) => void;
  /** 다음 페이지 로드 핸들러 */
  readonly handleEndReached: () => void;
}

const WatchHistoryContext = createContext<WatchHistoryContextType | undefined>(undefined);

/* Provider Props */

interface WatchHistoryProviderProps {
  readonly children: ReactNode;
  /** 특정 날짜 조회 (없으면 전체 조회) */
  readonly date?: string | undefined;
}

/* Provider */

export function WatchHistoryProvider({ children, date }: WatchHistoryProviderProps) {
  const navigation = useNavigation<NavigationProp>();

  // 뷰 모드 상태: 캘린더에서 진입 시(date 있음) 리스트 뷰 기본
  const [viewMode, setViewMode] = useState<ViewMode>(date ? 'list' : 'card');

  // 날짜 여부에 따라 다른 Hook 사용
  const byDateQuery = useWatchHistoryByDate(date ?? '', { enabled: !!date });
  const infiniteQuery = useInfiniteUniqueWatchHistory(20, { enabled: !date });

  // 데이터 통합
  const { items, isInitialLoading, isFetchingNextPage, hasNextPage } = useMemo(() => {
    if (date) {
      // placeholderData가 있으므로 isPlaceholderData도 체크
      const dateItems = byDateQuery.isPlaceholderData ? [] : (byDateQuery.data ?? []);
      // 초기 로딩 스켈레톤은 isFetching이 true이고 dateItems가 비어있을 때만 표시
      return {
        items: dateItems,
        isInitialLoading: byDateQuery.isFetching && dateItems.length === 0,
        isFetchingNextPage: false,
        hasNextPage: false,
      };
    }
    // 무한 스크롤 데이터 평탄화
    const allItems = infiniteQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return {
      items: allItems,
      // 아이템이 없고 로딩 중일 때만 초기 로딩 상태
      isInitialLoading: infiniteQuery.isFetching && allItems.length === 0,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
      hasNextPage: infiniteQuery.hasNextPage ?? false,
    };
  }, [
    date,
    byDateQuery.data,
    byDateQuery.isFetching,
    byDateQuery.isPlaceholderData,
    infiniteQuery.data,
    infiniteQuery.isFetching,
    infiniteQuery.isFetchingNextPage,
    infiniteQuery.hasNextPage,
  ]);

  // 시청 기록 화면 진입 이벤트 로깅 (최초 1회만)
  const hasLoggedViewRef = useRef(false);
  useEffect(() => {
    if (!isInitialLoading && !hasLoggedViewRef.current) {
      hasLoggedViewRef.current = true;
      analyticsService.watchHistoryView({
        date_filter: date ?? null,
        total_count: items.length,
      });
    }
  }, [isInitialLoading, items.length, date]);

  // 다음 페이지 로드
  const fetchNextPage = infiniteQuery.fetchNextPage;
  const handleEndReached = useCallback(() => {
    if (!date && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [date, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 아이템 클릭 핸들러 (콘텐츠 상세 페이지로 이동)
  // initialData로 이미지 경로와 진행률을 전달하여 API 응답 전에 즉시 표시
  const handleItemPress = useCallback(
    (item: WatchHistoryModelType) => {
      // 시청 기록 콘텐츠 클릭 이벤트 로깅
      const watchProgress =
        item.durationSeconds > 0
          ? Math.round((item.progressSeconds / item.durationSeconds) * 100)
          : 0;

      analyticsService.watchHistoryContentClick({
        content_id: item.contentId,
        content_type: item.contentType,
        watch_progress: watchProgress,
      });

      navigation.navigate(routePages.contentDetail, {
        id: item.contentId,
        type: item.contentType,
        title: item.contentTitle,
        source: ContentSource.WATCH_HISTORY,
        initialData: {
          backdropPath: item.contentBackdropPath,
          posterPath: item.contentPosterPath,
          progressSeconds: item.progressSeconds,
          durationSeconds: item.durationSeconds,
        },
      });
    },
    [navigation],
  );

  // Context 값 메모이제이션
  const contextValue: WatchHistoryContextType = useMemo(
    () => ({
      viewMode,
      setViewMode,
      items,
      isInitialLoading,
      isFetchingNextPage,
      hasNextPage,
      isDateMode: !!date,
      date,
      handleItemPress,
      handleEndReached,
    }),
    [
      viewMode,
      setViewMode,
      items,
      isInitialLoading,
      isFetchingNextPage,
      hasNextPage,
      date,
      handleItemPress,
      handleEndReached,
    ],
  );

  return (
    <WatchHistoryContext.Provider value={contextValue}>{children}</WatchHistoryContext.Provider>
  );
}

/* Hook */

/**
 * useWatchHistoryContext - 시청 기록 Context 접근 훅
 *
 * WatchHistoryProvider 내부에서만 사용 가능합니다.
 *
 * @throws WatchHistoryProvider 외부에서 호출 시 에러 발생
 *
 * @example
 * const { viewMode, items, handleItemPress } = useWatchHistoryContext();
 */
export function useWatchHistoryContext(): WatchHistoryContextType {
  const context = useContext(WatchHistoryContext);
  if (context === undefined) {
    throw new Error('useWatchHistoryContext must be used within a WatchHistoryProvider');
  }
  return context;
}
