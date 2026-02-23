/**
 * Watch History Feature
 *
 * 사용자 시청 기록 관리 기능을 제공합니다.
 * - 시청 기록 추가/삭제
 * - 캘린더용 월별 시청 기록 조회
 * - 시청 기록 목록 조회
 */

// API
export { watchHistoryApi } from './api/watchHistoryApi';

// Components
export { WatchHistoryCard, WatchHistorySectionView } from './components';

// Hooks
export {
  useFullyWatchedCount,
  useFullyWatchedList,
  useWatchHistoryByDate,
  useWatchHistoryCalendar,
  useWatchHistoryList,
  useUniqueWatchHistory,
  useWatchHistoryPreview,
  useInfiniteUniqueWatchHistory,
  useAddWatchHistory,
  useDeleteWatchHistory,
  useClearAllWatchHistory,
  useContentProgress,
} from './hooks/useWatchHistory';

export { useWatchProgressSync } from './hooks/useWatchProgressSync';

// Types (DTO)
export type {
  WatchHistoryDto,
  WatchHistoryWithContentDto,
  WatchHistoryCalendarItemDto,
  MonthlyWatchSummaryDto,
  CreateWatchHistoryParams,
  UpdateWatchProgressParams,
} from './types';

// Types (Model)
export { WatchHistoryModel, WatchHistoryCalendarModel } from './types/watchHistoryModel';
export type {
  WatchHistoryModel as WatchHistoryModelType,
  WatchHistoryCalendarModel as WatchHistoryCalendarModelType,
} from './types/watchHistoryModel';
