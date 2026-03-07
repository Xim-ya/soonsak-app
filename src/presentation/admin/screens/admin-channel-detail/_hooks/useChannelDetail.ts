/**
 * useChannelDetail - 채널 상세 훅
 *
 * 채널 상세 정보, 콘텐츠 목록, 삭제 로직을 관리합니다.
 */

import { useCallback } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useDialog } from '@/presentation/components/dialog';
import { ChannelLogger } from '@/core/utils';
import {
  adminChannelApi,
  type ChannelDetailItem,
  type ChannelContentItem,
} from '@/features/admin/api/adminChannelApi';

// ============================================================================
// Constants
// ============================================================================

/** 에러 메시지 매핑 */
const ERROR_MESSAGES = {
  FETCH_FAILED: '채널 정보를 불러오지 못했어요',
  CONTENTS_FETCH_FAILED: '콘텐츠 목록을 불러오지 못했어요',
  DELETE_FAILED: '채널을 삭제하지 못했어요',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
} as const;

/** 페이지당 콘텐츠 수 */
const CONTENTS_PAGE_SIZE = 21;

// ============================================================================
// Helpers
// ============================================================================

/**
 * 에러에서 사용자 친화적 메시지 추출
 */
function getUserFriendlyErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return fallback;
}

// ============================================================================
// Types
// ============================================================================

export interface UseChannelDetailReturn {
  /** 채널 상세 정보 */
  readonly channelDetail: ChannelDetailItem | null;
  /** 콘텐츠 목록 */
  readonly contents: ChannelContentItem[];
  /** 채널 정보 로딩 중 */
  readonly isLoading: boolean;
  /** 콘텐츠 목록 로딩 중 */
  readonly isContentsLoading: boolean;
  /** 다음 페이지 로딩 중 */
  readonly isFetchingNextPage: boolean;
  /** 다음 페이지 존재 여부 */
  readonly hasNextPage: boolean;
  /** 다음 페이지 조회 */
  readonly fetchNextPage: () => void;
  /** 채널 삭제 */
  readonly deleteChannel: () => Promise<void>;
  /** 삭제 중 여부 */
  readonly isDeleting: boolean;
  /** 새로고침 */
  readonly refetch: () => void;
}

// ============================================================================
// Query Keys
// ============================================================================

const QUERY_KEYS = {
  channelDetail: (channelId: string) => ['adminChannelDetail', channelId] as const,
  channelContents: (channelId: string) => ['adminChannelContents', channelId] as const,
  channels: ['adminChannels'] as const,
} as const;

// ============================================================================
// Hook
// ============================================================================

export function useChannelDetail(channelId: string): UseChannelDetailReturn {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { showDialog, showConfirmDialog } = useDialog();

  // 채널 상세 정보 조회
  const {
    data: channelDetail,
    isLoading,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: QUERY_KEYS.channelDetail(channelId),
    queryFn: () => adminChannelApi.getChannelDetail(channelId),
    staleTime: 30 * 1000, // 30초
    enabled: !!channelId,
  });

  // 채널 콘텐츠 목록 조회 (무한스크롤)
  const {
    data: contentsData,
    isLoading: isContentsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: fetchNextPageFn,
    refetch: refetchContents,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.channelContents(channelId),
    queryFn: ({ pageParam }) =>
      adminChannelApi.getChannelContents(channelId, pageParam, CONTENTS_PAGE_SIZE),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 30 * 1000,
    enabled: !!channelId,
  });

  // 콘텐츠 목록 평탄화
  const contents: ChannelContentItem[] = contentsData?.pages.flatMap((page) => page.contents) ?? [];

  // 채널 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => adminChannelApi.deleteChannel(channelId),
    onSuccess: async (result) => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channels });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.channelDetail(channelId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.channelContents(channelId) });

      const dialogResult = await showDialog({
        title: '삭제 완료',
        description: `채널을 삭제했어요\n영상 ${result.deletedVideosCount}개, 콘텐츠 ${result.deletedContentsCount}개도 함께 삭제했어요`,
        buttonText: '확인',
      });
      if (dialogResult === 'confirm') {
        navigation.goBack();
      }
    },
    onError: async (err) => {
      ChannelLogger.error('채널 삭제 실패:', err);
      const errorMessage = getUserFriendlyErrorMessage(err, ERROR_MESSAGES.DELETE_FAILED);
      await showDialog({
        title: '오류',
        description: errorMessage,
        buttonText: '확인',
      });
    },
  });

  // 채널 삭제 핸들러
  const deleteChannel = useCallback(async (): Promise<void> => {
    if (deleteMutation.isPending || !channelDetail) return;

    const videoCount = channelDetail.videoCount;
    const contentCount = channelDetail.contentCount;

    const result = await showConfirmDialog({
      title: '채널 삭제',
      description: `이 채널을 삭제하면 ${videoCount}개의 영상이 삭제되고, ${contentCount}개의 콘텐츠도 함께 삭제될 수 있어요\n\n정말 삭제할까요?`,
      leftButtonText: '취소',
      rightButtonText: '삭제',
    });
    if (result === 'right') {
      deleteMutation.mutate();
    }
  }, [deleteMutation, channelDetail, showConfirmDialog]);

  // 다음 페이지 조회 핸들러
  const fetchNextPage = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPageFn();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPageFn]);

  // 새로고침 핸들러
  const refetch = useCallback(() => {
    refetchDetail();
    refetchContents();
  }, [refetchDetail, refetchContents]);

  return {
    channelDetail: channelDetail ?? null,
    contents,
    isLoading,
    isContentsLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    deleteChannel,
    isDeleting: deleteMutation.isPending,
    refetch,
  };
}
