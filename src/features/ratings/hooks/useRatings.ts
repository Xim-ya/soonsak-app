/**
 * 평점 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/shared/providers/AuthProvider';
import { showGlobalInfo } from '@/shared/utils/snackbarRef';
import { analyticsService } from '@/shared/analytics';
import { Logger } from '@/shared/utils/logger';
import { wowPointWebhook } from '@/shared/services/wowPointWebhook';
import { ratingsApi } from '../api/ratingsApi';
import type { SetRatingParams } from '../types';
import { RatingModel, RatingStatusModel } from '../types/ratingModel';

const RatingsLogger = Logger.create('Ratings');

/** 캐시 시간 상수 */
const TWO_MINUTES = 2 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Query Key 팩토리
 */
export const ratingKeys = {
  all: (userId: string | null) => ['ratings', userId] as const,
  count: (userId: string | null) => [...ratingKeys.all(userId), 'count'] as const,
  status: (userId: string | null, contentId: number, contentType: string) =>
    [...ratingKeys.all(userId), 'status', contentId, contentType] as const,
  list: (userId: string | null) => [...ratingKeys.all(userId), 'list'] as const,
};

/**
 * 평점 상태 조회 Hook
 */
export const useRatingStatus = (
  contentId: number,
  contentType: string,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<RatingStatusModel, Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ratingKeys.status(userId, contentId, contentType),
    queryFn: () => ratingsApi.getRatingStatus(contentId, contentType),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { hasRating: false, rating: null, ratingId: null },
    select: RatingStatusModel.fromDto,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 평점 등록/수정 Mutation Hook (Optimistic Update)
 */
export const useSetRating = () => {
  const queryClient = useQueryClient();
  const { user, displayName } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (params: SetRatingParams) => ratingsApi.setRating(params),

    onMutate: async (params) => {
      const queryKey = ratingKeys.status(userId, params.contentId, params.contentType);

      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 상태 저장 (롤백용)
      const previousStatus = queryClient.getQueryData<RatingStatusModel>(queryKey);

      // Optimistic Update: 즉시 UI 업데이트
      const optimisticStatus: RatingStatusModel =
        params.rating === 0
          ? { hasRating: false, rating: null, ratingId: null }
          : { hasRating: true, rating: params.rating, ratingId: 'optimistic' };

      queryClient.setQueryData<RatingStatusModel>(queryKey, optimisticStatus);

      return { previousStatus, queryKey };
    },

    onSuccess: (_data, params, context) => {
      // 스낵바 표시
      if (params.rating === 0) {
        showGlobalInfo('평점을 취소했어요');
      } else {
        showGlobalInfo('평점을 매겼어요');

        // GA4 content_rating_submit 이벤트 로깅 (평점 등록/수정 시에만)
        const hadPreviousRating = context?.previousStatus?.hasRating ?? false;
        analyticsService.contentRatingSubmit({
          content_id: params.contentId,
          content_type: params.contentType,
          rating: params.rating,
          action: hadPreviousRating ? 'update' : 'add',
        });

        // Slack 웹훅 알림 (평점 등록/수정 시에만)
        wowPointWebhook.onVideoRating({
          nickname: displayName,
          ...(params.contentTitle && { videoTitle: params.contentTitle }),
          rating: params.rating,
        });
      }
    },

    onError: (_error, _params, context) => {
      // 에러 시 롤백
      if (context?.previousStatus) {
        queryClient.setQueryData(context.queryKey, context.previousStatus);
      }
      RatingsLogger.error('평점 등록 실패:', _error);
    },

    onSettled: (_data, _error, params) => {
      // 완료 후 쿼리 무효화 (서버 상태와 동기화)
      queryClient.invalidateQueries({
        queryKey: ratingKeys.status(userId, params.contentId, params.contentType),
      });
      // 목록 및 개수도 무효화
      queryClient.invalidateQueries({ queryKey: ratingKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: ratingKeys.count(userId) });
    },
  });
};

/**
 * 평점 목록 조회 Hook (페이지네이션)
 */
export const useRatingsList = (
  limit: number = 20,
  offset: number = 0,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<
  {
    items: RatingModel[];
    hasMore: boolean;
    totalCount: number;
  },
  Error
> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: [...ratingKeys.list(userId), limit, offset],
    queryFn: () => ratingsApi.getRatingsList(limit, offset),
    select: (data) => ({
      items: RatingModel.fromDtoList(data.items),
      hasMore: data.hasMore,
      totalCount: data.totalCount,
    }),
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { items: [], hasMore: false, totalCount: 0 },
    staleTime: TWO_MINUTES,
    gcTime: TEN_MINUTES,
  });
};
