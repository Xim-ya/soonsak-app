/**
 * 찜하기 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/shared/providers/AuthProvider';
import { showGlobalInfo } from '@/shared/utils/snackbarRef';
import { analyticsService } from '@/shared/analytics';
import { Logger } from '@/shared/utils/logger';
import { wowPointWebhook } from '@/shared/services/wowPointWebhook';
import { favoritesApi } from '../api/favoritesApi';
import type { ToggleFavoriteParams } from '../types';
import { FavoriteModel, FavoriteStatusModel } from '../types/favoriteModel';

const FavoritesLogger = Logger.create('Favorites');

/** 캐시 시간 상수 */
const FIVE_MINUTES = 5 * 60 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Query Key 팩토리
 * - userId를 포함하여 로그인 상태 변경 시 자동으로 새 캐시 사용
 */
export const favoriteKeys = {
  all: (userId: string | null) => ['favorites', userId] as const,
  count: (userId: string | null) => [...favoriteKeys.all(userId), 'count'] as const,
  status: (userId: string | null, contentId: number, contentType: string) =>
    [...favoriteKeys.all(userId), 'status', contentId, contentType] as const,
  list: (userId: string | null) => [...favoriteKeys.all(userId), 'list'] as const,
};

/**
 * 찜 개수 조회 Hook
 */
export const useFavoritesCount = (options?: {
  enabled?: boolean;
}): UseQueryResult<number, Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: favoriteKeys.count(userId),
    queryFn: () => favoritesApi.getFavoritesCount(),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: 0,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 찜 상태 조회 Hook
 */
export const useFavoriteStatus = (
  contentId: number,
  contentType: string,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<FavoriteStatusModel, Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: favoriteKeys.status(userId, contentId, contentType),
    queryFn: () => favoritesApi.getFavoriteStatus(contentId, contentType),
    select: FavoriteStatusModel.fromDto,
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { isFavorited: false, favoriteId: null },
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 찜 토글 Mutation Hook (Optimistic Update)
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (params: ToggleFavoriteParams) => favoritesApi.toggleFavorite(params),

    onMutate: async (params) => {
      const queryKey = favoriteKeys.status(userId, params.contentId, params.contentType);

      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 상태 저장 (롤백용)
      const previousStatus = queryClient.getQueryData<FavoriteStatusModel>(queryKey);

      // Optimistic Update: 즉시 UI 업데이트
      queryClient.setQueryData<FavoriteStatusModel>(queryKey, (old) => ({
        isFavorited: !old?.isFavorited,
        favoriteId: old?.isFavorited ? null : 'optimistic',
      }));

      return { previousStatus, queryKey };
    },

    onSuccess: (_data, params, context) => {
      // 스낵바 표시
      const wasAdded = !context?.previousStatus?.isFavorited;
      showGlobalInfo(wasAdded ? '찜 목록에 추가했어요!' : '찜 목록에서 제거했어요');

      // GA4 content_favorite_toggle 이벤트 로깅
      analyticsService.contentFavoriteToggle({
        content_id: params.contentId,
        content_type: params.contentType,
        action: wasAdded ? 'add' : 'remove',
        screen_name: params.screenName ?? 'content_detail',
      });

      // 찜 추가 시에만 웹훅 호출
      if (wasAdded) {
        wowPointWebhook.onVideoFavorite({
          ...(params.nickname && { nickname: params.nickname }),
          ...(params.videoTitle && { videoTitle: params.videoTitle }),
        });
      }
    },

    onError: (_error, _params, context) => {
      // 에러 시 롤백
      if (context?.previousStatus) {
        queryClient.setQueryData(context.queryKey, context.previousStatus);
      }
      FavoritesLogger.error('찜 토글 실패:', _error);
    },

    onSettled: (_data, _error, params) => {
      // 완료 후 쿼리 무효화 (서버 상태와 동기화)
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.status(userId, params.contentId, params.contentType),
      });
      // 목록 및 개수도 무효화
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.count(userId) });
    },
  });
};

/**
 * 찜 목록 조회 Hook (페이지네이션)
 */
export const useFavoritesList = (
  limit: number = 20,
  offset: number = 0,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<
  {
    items: FavoriteModel[];
    hasMore: boolean;
    totalCount: number;
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: [...favoriteKeys.list(userId), limit, offset],
    queryFn: () => favoritesApi.getFavoritesList(limit, offset),
    select: (data) => ({
      items: FavoriteModel.fromDtoList(data.items),
      hasMore: data.hasMore,
      totalCount: data.totalCount,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { items: [], hasMore: false, totalCount: 0 },
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};
