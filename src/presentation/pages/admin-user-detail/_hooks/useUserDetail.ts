/**
 * useUserDetail - 유저 상세 훅
 *
 * 유저 상세 정보, 역할 변경, 푸시 발송 로직을 관리합니다.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { adminUserApi, type UserDetailItem } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';

interface UseUserDetailReturn {
  /** 유저 상세 정보 */
  readonly user: UserDetailItem | null;
  /** 로딩 중 여부 */
  readonly isLoading: boolean;
  /** 에러 */
  readonly error: Error | null;
  /** 역할 변경 중 여부 */
  readonly isUpdatingRole: boolean;
  /** 역할 변경 */
  readonly updateRole: (newRole: UserRole) => Promise<void>;
  /** 푸시 발송 중 여부 */
  readonly isSendingPush: boolean;
  /** 푸시 발송 */
  readonly sendPush: (title: string, body: string) => Promise<boolean>;
  /** 새로고침 */
  readonly refetch: () => void;
}

export function useUserDetail(userId: string): UseUserDetailReturn {
  const queryClient = useQueryClient();
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isSendingPush, setIsSendingPush] = useState(false);

  // 유저 상세 정보 조회
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminUserDetail', userId],
    queryFn: () => adminUserApi.getUserDetail(userId),
    staleTime: 30 * 1000, // 30초
    enabled: !!userId,
  });

  // 역할 변경 뮤테이션
  const updateRoleMutation = useMutation({
    mutationFn: (newRole: UserRole) => adminUserApi.updateUserRole(userId, newRole),
    onSuccess: () => {
      // 유저 상세 및 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['adminUserDetail', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserRoleCounts'] });
    },
  });

  // 역할 변경 핸들러
  const updateRole = useCallback(
    async (newRole: UserRole) => {
      if (isUpdatingRole) return;

      setIsUpdatingRole(true);
      try {
        await updateRoleMutation.mutateAsync(newRole);
        Alert.alert('성공', '역할이 변경되었습니다.');
      } catch (err) {
        console.error('역할 변경 실패:', err);
        Alert.alert('오류', '역할 변경에 실패했습니다.');
      } finally {
        setIsUpdatingRole(false);
      }
    },
    [isUpdatingRole, updateRoleMutation],
  );

  // 푸시 발송 핸들러
  const sendPush = useCallback(
    async (title: string, body: string): Promise<boolean> => {
      if (isSendingPush) return false;

      setIsSendingPush(true);
      try {
        const result = await adminUserApi.sendPushNotification(userId, title, body);

        if (result.success) {
          Alert.alert('성공', `푸시 알림이 발송되었습니다. (성공: ${result.sentCount})`);
          return true;
        } else {
          Alert.alert('실패', '활성화된 푸시 토큰이 없습니다.');
          return false;
        }
      } catch (err) {
        console.error('푸시 발송 실패:', err);
        Alert.alert('오류', '푸시 발송에 실패했습니다.');
        return false;
      } finally {
        setIsSendingPush(false);
      }
    },
    [isSendingPush, userId],
  );

  // 새로고침 핸들러
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    user: user ?? null,
    isLoading,
    error: error as Error | null,
    isUpdatingRole,
    updateRole,
    isSendingPush,
    sendPush,
    refetch: handleRefetch,
  };
}
