/**
 * useUserDetail - 유저 상세 훅
 *
 * 유저 상세 정보, 역할 변경, 푸시 발송 로직을 관리합니다.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { adminUserApi, type PushData } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';
import {
  userDetailFromDto,
  type UserDetailModel as UserDetailModelType,
} from '../_types/userDetailModel';

// ============================================================================
// Constants
// ============================================================================

/** 에러 메시지 매핑 */
const ERROR_MESSAGES = {
  ROLE_UPDATE_FAILED: '역할 변경에 실패했습니다.',
  PUSH_SEND_FAILED: '푸시 발송에 실패했습니다.',
  NO_ACTIVE_TOKENS: '활성화된 푸시 토큰이 없습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',
} as const;

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
  if (message.includes('timeout') || message.includes('abort')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  return fallback;
}

// ============================================================================
// Types
// ============================================================================

interface UseUserDetailReturn {
  /** 유저 상세 정보 */
  readonly user: UserDetailModelType | null;
  /** 로딩 중 여부 */
  readonly isLoading: boolean;
  /** 에러 */
  readonly error: Error | null;
  /** 역할 변경 중 여부 */
  readonly isUpdatingRole: boolean;
  /** 역할 변경 */
  readonly updateRole: (newRole: UserRole) => void;
  /** 푸시 발송 중 여부 */
  readonly isSendingPush: boolean;
  /** 푸시 발송 (딥링크 데이터 포함 가능) */
  readonly sendPush: (title: string, body: string, data?: PushData) => Promise<boolean>;
  /** 새로고침 */
  readonly refetch: () => void;
}

// ============================================================================
// Query Keys
// ============================================================================

const QUERY_KEYS = {
  userDetail: (userId: string) => ['adminUserDetail', userId] as const,
  users: ['adminUsers'] as const,
  roleCounts: ['adminUserRoleCounts'] as const,
} as const;

// ============================================================================
// Hook
// ============================================================================

export function useUserDetail(userId: string): UseUserDetailReturn {
  const queryClient = useQueryClient();

  // 유저 상세 정보 조회
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.userDetail(userId),
    queryFn: async () => {
      const dto = await adminUserApi.getUserDetail(userId);
      // DTO를 Model로 변환
      return userDetailFromDto(dto);
    },
    staleTime: 30 * 1000, // 30초
    enabled: !!userId,
  });

  // 역할 변경 뮤테이션
  const updateRoleMutation = useMutation({
    mutationFn: (newRole: UserRole) => adminUserApi.updateUserRole(userId, newRole),
    onSuccess: () => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roleCounts });
      Alert.alert('성공', '역할이 변경되었습니다.');
    },
    onError: (err) => {
      console.error('역할 변경 실패:', err);
      const errorMessage = getUserFriendlyErrorMessage(err, ERROR_MESSAGES.ROLE_UPDATE_FAILED);
      Alert.alert('오류', errorMessage);
    },
  });

  // 푸시 발송 뮤테이션
  const sendPushMutation = useMutation({
    mutationFn: ({ title, body, data }: { title: string; body: string; data?: PushData }) =>
      adminUserApi.sendPushNotification(userId, title, body, data),
  });

  // 역할 변경 핸들러
  const updateRole = useCallback(
    (newRole: UserRole) => {
      if (updateRoleMutation.isPending) return;
      updateRoleMutation.mutate(newRole);
    },
    [updateRoleMutation],
  );

  // 푸시 발송 핸들러
  const sendPush = useCallback(
    async (title: string, body: string, data?: PushData): Promise<boolean> => {
      // 중복 요청 방지
      if (sendPushMutation.isPending) return false;

      // 입력값 검증
      const trimmedTitle = title?.trim() ?? '';
      const trimmedBody = body?.trim() ?? '';

      if (trimmedBody.length === 0) {
        Alert.alert('입력 오류', '내용을 입력해주세요.');
        return false;
      }

      try {
        const result = await sendPushMutation.mutateAsync({
          title: trimmedTitle,
          body: trimmedBody,
          ...(data && { data }),
        });

        if (result.success) {
          const hasDeeplink = data !== undefined;
          const deeplinkInfo = hasDeeplink ? '\n(딥링크 포함)' : '';
          const message =
            result.failedCount > 0
              ? `푸시 알림이 발송되었습니다.${deeplinkInfo}\n성공: ${result.sentCount}, 실패: ${result.failedCount}`
              : `푸시 알림이 발송되었습니다.${deeplinkInfo} (${result.sentCount}건)`;
          Alert.alert('성공', message);
          return true;
        }

        Alert.alert('실패', ERROR_MESSAGES.NO_ACTIVE_TOKENS);
        return false;
      } catch (err) {
        console.error('푸시 발송 실패:', err);
        const errorMessage = getUserFriendlyErrorMessage(err, ERROR_MESSAGES.PUSH_SEND_FAILED);
        Alert.alert('오류', errorMessage);
        return false;
      }
    },
    [sendPushMutation],
  );

  return {
    user: user ?? null,
    isLoading,
    error: error as Error | null,
    isUpdatingRole: updateRoleMutation.isPending,
    updateRole,
    isSendingPush: sendPushMutation.isPending,
    sendPush,
    refetch,
  };
}
