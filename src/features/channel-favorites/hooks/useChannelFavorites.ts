/**
 * 채널 찜하기 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/shared/providers/AuthProvider';
import { showGlobalInfo } from '@/shared/utils/snackbarRef';
import { channelFavoritesApi } from '../api/channelFavoritesApi';
import type { ToggleChannelFavoriteParams } from '../types';
import {
  ChannelFavoriteStatusModel,
  fromChannelFavoriteStatusDto,
} from '../types/channelFavoriteModel';

/** 캐시 시간 상수 */
const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/**
 * Query Key 팩토리
 * - userId를 포함하여 로그인 상태 변경 시 자동으로 새 캐시 사용
 */
export const channelFavoriteKeys = {
  all: (userId: string | null) => ['channelFavorites', userId] as const,
  status: (userId: string | null, channelId: string) =>
    [...channelFavoriteKeys.all(userId), 'status', channelId] as const,
  ids: (userId: string | null) => [...channelFavoriteKeys.all(userId), 'ids'] as const,
};

/**
 * 찜한 채널 ID 목록 조회 Hook
 * 채널 목록에서 찜한 채널을 앞으로 정렬할 때 사용
 */
export const useFavoriteChannelIds = (): UseQueryResult<string[], Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: channelFavoriteKeys.ids(userId),
    queryFn: () => channelFavoritesApi.getFavoriteChannelIds(),
    enabled: !!userId,
    placeholderData: [],
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 채널 찜 상태 조회 Hook
 */
export const useChannelFavoriteStatus = (
  channelId: string,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<ChannelFavoriteStatusModel, Error> => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: channelFavoriteKeys.status(userId, channelId),
    queryFn: () => channelFavoritesApi.getChannelFavoriteStatus(channelId),
    select: fromChannelFavoriteStatusDto,
    enabled: (options?.enabled ?? true) && !!userId,
    placeholderData: { isFavorited: false, favoriteId: null },
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
};

/**
 * 채널 찜 토글 Mutation Hook (Optimistic Update)
 */
export const useToggleChannelFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (params: ToggleChannelFavoriteParams) =>
      channelFavoritesApi.toggleChannelFavorite(params),

    onMutate: async (params) => {
      const queryKey = channelFavoriteKeys.status(userId, params.channelId);

      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 상태 저장 (롤백용)
      const previousStatus = queryClient.getQueryData<ChannelFavoriteStatusModel>(queryKey);

      // Optimistic Update: 즉시 UI 업데이트
      queryClient.setQueryData<ChannelFavoriteStatusModel>(queryKey, (old) => ({
        isFavorited: !old?.isFavorited,
        favoriteId: old?.isFavorited ? null : 'optimistic',
      }));

      return { previousStatus, queryKey };
    },

    onSuccess: (_data, _params, context) => {
      // 스낵바 표시
      const wasAdded = !context?.previousStatus?.isFavorited;
      showGlobalInfo(wasAdded ? '채널을 찜했어요!' : '채널 찜을 취소했어요');
    },

    onError: (_error, _params, context) => {
      // 에러 시 롤백
      if (context?.previousStatus) {
        queryClient.setQueryData(context.queryKey, context.previousStatus);
      }
      console.error('채널 찜 토글 실패:', _error);
    },

    onSettled: (_data, _error, params) => {
      // 완료 후 쿼리 무효화 (서버 상태와 동기화)
      queryClient.invalidateQueries({
        queryKey: channelFavoriteKeys.status(userId, params.channelId),
      });
      // 찜한 채널 ID 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: channelFavoriteKeys.ids(userId),
      });
    },
  });
};
