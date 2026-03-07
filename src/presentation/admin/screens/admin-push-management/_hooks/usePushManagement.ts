/**
 * usePushManagement - 푸시 관리 화면 훅
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { PushLogger } from '@/core/utils';
import { adminPushApi, type PushScheduleStatus } from '@/features/admin/api/adminPushApi';
import type { PushData } from '@/features/admin/types/pushAction';
import type {
  PushTemplateModel,
  PushStatisticsModel,
  PushReceiptModel,
  PushManagementTab,
} from '../_types';
import { SCHEDULE_STATUS_LABELS, DELIVERY_STATUS_LABELS } from '../_types';

/** 날짜 포맷팅 (짧은 형식) */
function formatDateTime(dateString: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/** 날짜 포맷팅 (전체 형식) */
function formatFullDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${year}.${month}.${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/** 템플릿 데이터를 화면 모델로 변환 */
function toTemplateModel(
  item: Awaited<ReturnType<typeof adminPushApi.getTemplates>>[number],
): PushTemplateModel {
  return {
    ...item,
    scheduleStatusLabel: SCHEDULE_STATUS_LABELS[item.scheduleStatus],
    nextRunAtFormatted: formatDateTime(item.nextRunAt),
    lastRunAtFormatted: formatDateTime(item.lastRunAt),
  };
}

/** 발송 내역 데이터를 화면 모델로 변환 */
function toReceiptModel(
  item: Awaited<ReturnType<typeof adminPushApi.getReceiptsWithUser>>['receipts'][number],
): PushReceiptModel {
  return {
    ...item,
    deliveryStatusLabel: DELIVERY_STATUS_LABELS[item.deliveryStatus],
    isRead: item.readAt !== null,
    isClicked: item.clickedAt !== null,
    sentAtFormatted: formatDateTime(item.sentAt),
    createdAtFormatted: formatFullDateTime(item.createdAt),
  };
}

// Query keys
const PUSH_QUERY_KEYS = {
  templates: ['admin', 'push', 'templates'] as const,
  statistics: ['admin', 'push', 'statistics'] as const,
  receipts: (searchQuery: string) => ['admin', 'push', 'receipts', searchQuery] as const,
};

export function usePushManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PushManagementTab>('receipts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // 템플릿 목록 조회
  const {
    data: templates = [],
    isLoading: isTemplatesLoading,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: PUSH_QUERY_KEYS.templates,
    queryFn: async () => {
      const data = await adminPushApi.getTemplates();
      return data.map(toTemplateModel);
    },
    enabled: activeTab === 'templates',
  });

  // 통계 조회
  const {
    data: statistics,
    isLoading: isStatisticsLoading,
    refetch: refetchStatistics,
  } = useQuery({
    queryKey: PUSH_QUERY_KEYS.statistics,
    queryFn: adminPushApi.getStatistics,
  });


  // 발송 내역 조회 (무한스크롤)
  const {
    data: receiptsData,
    isLoading: isReceiptsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchReceipts,
  } = useInfiniteQuery({
    queryKey: PUSH_QUERY_KEYS.receipts(searchQuery),
    queryFn: async ({ pageParam }) => {
      const result = await adminPushApi.getReceiptsWithUser({
        searchQuery: searchQuery || null,
        cursor: pageParam ?? null,
        limit: 30,
      });
      return {
        ...result,
        receipts: result.receipts.map(toReceiptModel),
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: null as string | null,
    enabled: activeTab === 'receipts',
  });

  // 발송 내역 플랫 리스트
  const receipts = receiptsData?.pages.flatMap((page) => page.receipts) ?? [];

  // 스케줄 상태 변경 mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ templateId, status }: { templateId: string; status: PushScheduleStatus }) =>
      adminPushApi.updateTemplateScheduleStatus(templateId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.templates });
      queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.statistics });
    },
    onError: (error) => {
      PushLogger.error('스케줄 상태 변경 실패:', error);
      Alert.alert('오류', '스케줄 상태 변경에 실패했어요');
    },
  });

  // 템플릿 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => adminPushApi.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.templates });
      queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.statistics });
    },
    onError: (error) => {
      PushLogger.error('템플릿 삭제 실패:', error);
      Alert.alert('오류', '템플릿 삭제에 실패했어요');
    },
  });

  // 탭 변경
  const handleTabChange = useCallback((tab: PushManagementTab) => {
    setActiveTab(tab);
  }, []);

  // 검색어 변경
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 검색 실행
  const handleSearch = useCallback(() => {
    refetchReceipts();
  }, [refetchReceipts]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (activeTab === 'receipts') {
      await Promise.all([refetchReceipts(), refetchStatistics()]);
    } else {
      await Promise.all([refetchTemplates(), refetchStatistics()]);
    }
    setIsRefreshing(false);
  }, [activeTab, refetchReceipts, refetchTemplates, refetchStatistics]);

  // 무한스크롤 로드 더보기
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 스케줄 취소
  const handleCancelSchedule = useCallback(
    (templateId: string, templateName: string) => {
      Alert.alert('스케줄 취소', `"${templateName}" 스케줄을 취소할까요?`, [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: () => {
            updateStatusMutation.mutate({ templateId, status: 'cancelled' });
          },
        },
      ]);
    },
    [updateStatusMutation],
  );

  // 스케줄 재활성화
  const handleReactivateSchedule = useCallback(
    (templateId: string) => {
      updateStatusMutation.mutate({ templateId, status: 'scheduled' });
    },
    [updateStatusMutation],
  );

  // 템플릿 삭제
  const handleDeleteTemplate = useCallback(
    (templateId: string, templateName: string) => {
      Alert.alert(
        '템플릿 삭제',
        `"${templateName}" 템플릿을 삭제할까요?\n이 작업은 되돌릴 수 없어요.`,
        [
          { text: '아니오', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              deleteMutation.mutate(templateId);
            },
          },
        ],
      );
    },
    [deleteMutation],
  );

  // 활성 토글
  const handleToggleActive = useCallback(
    async (templateId: string, currentActive: boolean) => {
      try {
        await adminPushApi.updateTemplate(templateId, { isActive: !currentActive });
        queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.templates });
        queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.statistics });
      } catch (error) {
        PushLogger.error('활성 상태 변경 실패:', error);
        Alert.alert('오류', '활성 상태 변경에 실패했어요');
      }
    },
    [queryClient],
  );

  // 전체 푸시 발송
  const handleSendBroadcast = useCallback(
    async (
      title: string,
      body: string,
      data?: PushData,
      appVersion?: string | null,
    ): Promise<boolean> => {
      setIsSendingBroadcast(true);
      try {
        const result = await adminPushApi.sendBroadcastPush(title, body, data, appVersion);
        if (result.success) {
          const versionText = appVersion === undefined ? '전체' : appVersion ?? '버전 미지정';
          Alert.alert(
            '발송 완료',
            `푸시 발송이 완료되었어요.\n\n대상 버전: ${versionText}\n성공: ${result.sentCount}건\n실패: ${result.failedCount}건\n총 토큰: ${result.totalTokens}개`,
          );
          // 발송 내역 새로고침
          queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.receipts(searchQuery) });
          queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEYS.statistics });
          return true;
        } else {
          // 대상 토큰이 없는 경우와 발송 실패를 구분
          const hasTargetTokens = result.totalTokens > 0;
          const errorMessage = hasTargetTokens
            ? `푸시 발송에 실패했어요.\n\n총 토큰: ${result.totalTokens}개\n실패: ${result.failedCount}건`
            : '해당 조건의 활성 푸시 토큰이 없어요';
          Alert.alert('발송 실패', errorMessage);
          return false;
        }
      } catch (error) {
        PushLogger.error('전체 푸시 발송 실패:', error);
        Alert.alert('오류', '전체 푸시 발송에 실패했어요');
        return false;
      } finally {
        setIsSendingBroadcast(false);
      }
    },
    [queryClient, searchQuery],
  );

  return {
    // Tab
    activeTab,
    handleTabChange,
    // Search
    searchQuery,
    handleSearchChange,
    handleSearch,
    // Templates
    templates,
    isTemplatesLoading,
    // Receipts
    receipts,
    isReceiptsLoading,
    isFetchingNextPage,
    hasNextPage,
    handleLoadMore,
    // Statistics
    statistics: statistics as PushStatisticsModel | undefined,
    isStatisticsLoading,
    // Actions
    isRefreshing,
    handleRefresh,
    handleCancelSchedule,
    handleReactivateSchedule,
    handleDeleteTemplate,
    handleToggleActive,
    // Broadcast
    isSendingBroadcast,
    handleSendBroadcast,
    activePushTokens: statistics?.activePushTokens ?? 0,
  };
}
