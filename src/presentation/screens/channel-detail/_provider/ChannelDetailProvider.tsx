import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import type { SortType } from '@/shared/types/sort';
import type { ViewMode } from '@/presentation/components/view-mode';
import { analyticsService } from '@/shared/analytics';
import { useChannelInfo } from '../_hooks/useChannelInfo';
import { useChannelContents } from '../_hooks/useChannelContents';
import { ChannelVideoModel } from '../_types';

/**
 * 채널 상세 Context 타입 정의
 * 채널 정보, 정렬/뷰 모드 상태, 콘텐츠 데이터를 관리합니다.
 */
interface ChannelDetailContextType {
  // 채널 ID
  readonly channelId: string;

  // 정렬 상태
  readonly sortType: SortType;
  readonly setSortType: (sortType: SortType) => void;

  // 뷰 모드 상태
  readonly viewMode: ViewMode;
  readonly setViewMode: (viewMode: ViewMode) => void;

  // 채널 정보
  readonly displayName: string;
  readonly displayLogoUrl: string;
  readonly formattedSubscriberCount: string;
  readonly isChannelLoading: boolean;

  // 콘텐츠 데이터
  readonly videos: readonly ChannelVideoModel[];
  readonly totalCount: number;
  readonly isLoading: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
}

const ChannelDetailContext = createContext<ChannelDetailContextType | undefined>(undefined);

interface ChannelDetailProviderProps {
  readonly children: ReactNode;
  readonly channelId: string;
  readonly channelName?: string | undefined;
  readonly channelLogoUrl?: string | undefined;
  readonly subscriberCount?: number | undefined;
  /** 채널 상세 진입 경로 (GA 로깅용) */
  readonly source?: string | undefined;
}

/**
 * ChannelDetailProvider - 채널 상세 화면에서 상태를 관리하는 프로바이더
 *
 * 채널 정보, 정렬 상태, 뷰 모드, 콘텐츠 데이터를 Context로 통합 관리합니다.
 * 하위 컴포넌트에서 useChannelDetail() 훅을 통해 접근할 수 있습니다.
 *
 * @example
 * <ChannelDetailProvider
 *   channelId="UC..."
 *   channelName="채널명"
 *   channelLogoUrl="https://..."
 *   subscriberCount={100000}
 * >
 *   <ChannelDetailContent />
 * </ChannelDetailProvider>
 */
export function ChannelDetailProvider({
  children,
  channelId,
  channelName,
  channelLogoUrl,
  subscriberCount,
  source = 'direct',
}: ChannelDetailProviderProps) {
  // 정렬 상태 (기본값: 최신순)
  const [sortType, setSortType] = useState<SortType>('latest');
  // 뷰 모드 상태 (기본값: 카드 뷰)
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // 채널 정보 관리
  const { displayName, displayLogoUrl, isChannelLoading, formattedSubscriberCount } =
    useChannelInfo({
      channelId,
      channelName,
      channelLogoUrl,
      subscriberCount,
    });

  // GA4 channel_view 이벤트 로깅 (화면 진입 시 1회만)
  const hasLoggedViewRef = useRef(false);
  useEffect(() => {
    if (!hasLoggedViewRef.current && displayName) {
      analyticsService.channelView({
        channel_id: channelId,
        channel_name: displayName,
        source,
      });
      hasLoggedViewRef.current = true;
    }
  }, [channelId, displayName, source]);

  // 채널 콘텐츠 관리 (정렬 타입 전달)
  const { videos, isLoading, fetchNextPage, hasNextPage, totalCount } = useChannelContents(
    channelId,
    sortType,
  );

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((newSortType: SortType) => {
    setSortType(newSortType);
  }, []);

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = useCallback((newViewMode: ViewMode) => {
    setViewMode(newViewMode);
  }, []);

  const contextValue: ChannelDetailContextType = useMemo(
    () => ({
      // 채널 ID
      channelId,

      // 정렬 상태
      sortType,
      setSortType: handleSortChange,

      // 뷰 모드 상태
      viewMode,
      setViewMode: handleViewModeChange,

      // 채널 정보
      displayName,
      displayLogoUrl,
      formattedSubscriberCount,
      isChannelLoading,

      // 콘텐츠 데이터
      videos,
      totalCount,
      isLoading,
      hasNextPage,
      fetchNextPage,
    }),
    [
      channelId,
      sortType,
      handleSortChange,
      viewMode,
      handleViewModeChange,
      displayName,
      displayLogoUrl,
      formattedSubscriberCount,
      isChannelLoading,
      videos,
      totalCount,
      isLoading,
      hasNextPage,
      fetchNextPage,
    ],
  );

  return (
    <ChannelDetailContext.Provider value={contextValue}>{children}</ChannelDetailContext.Provider>
  );
}

/**
 * useChannelDetail - 채널 상세 Context에 접근하는 훅
 *
 * ChannelDetailProvider 내부에서만 사용 가능합니다.
 * 채널 정보, 정렬/뷰 모드 상태, 콘텐츠 데이터에 접근할 수 있습니다.
 *
 * @example
 * function ChannelHeader() {
 *   const { displayName, displayLogoUrl, isChannelLoading } = useChannelDetail();
 *   // ...
 * }
 *
 * @throws Provider 외부에서 호출 시 에러 발생
 */
export function useChannelDetail(): ChannelDetailContextType {
  const context = useContext(ChannelDetailContext);
  if (context === undefined) {
    throw new Error('useChannelDetail must be used within a ChannelDetailProvider');
  }
  return context;
}
