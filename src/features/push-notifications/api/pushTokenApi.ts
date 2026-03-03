/**
 * Push Token API
 *
 * Expo Push Token을 Supabase에 저장하고 관리하는 API 함수들을 제공합니다.
 * - 토큰 등록/업데이트 (upsert)
 * - 토큰 비활성화
 * - 토큰 삭제 (로그아웃 시)
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseClient } from '@/shared/api/supabaseClient';
import { PUSH_DATABASE } from '@/shared/config/dbConfig';
import { getOrCreateDeviceId } from '@/shared/utils/deviceId';
import { PushLogger } from '@/shared/utils/logger';

/** AsyncStorage 키: 로컬에 저장된 푸시 토큰 */
const PUSH_TOKEN_STORAGE_KEY = '@soonsak/expo_push_token';

/** 푸시 토큰 DTO */
export interface PushTokenDto {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  deviceId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const pushTokenApi = {
  /**
   * 푸시 토큰 동기화 (upsert)
   *
   * 새 토큰을 서버에 등록하거나 기존 토큰을 업데이트합니다.
   * 같은 유저의 다른 모든 토큰은 비활성화합니다 (한 유저 = 한 활성 토큰).
   *
   * @param userId 사용자 ID
   * @param token Expo Push Token
   */
  syncToken: async (userId: string, token: string): Promise<void> => {
    // device_id 조회 (없으면 생성)
    const deviceId = await getOrCreateDeviceId();

    // SECURITY DEFINER 함수를 사용하여 토큰 동기화
    // - 다른 유저의 동일 토큰 삭제 (RLS 우회)
    // - 현재 유저의 토큰 upsert
    const { error: rpcError } = await supabaseClient.rpc('sync_push_token', {
      p_user_id: userId,
      p_token: token,
      p_platform: Platform.OS,
      p_device_id: deviceId,
    });

    if (rpcError) {
      throw new Error(`Failed to sync push token via RPC: ${rpcError.message}`);
    }

    // 로컬에 토큰 저장
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  },

  /**
   * 특정 토큰 비활성화
   *
   * DeviceNotRegistered 에러 발생 시 또는 토큰 변경 시 호출합니다.
   *
   * @param userId 사용자 ID
   * @param token 비활성화할 토큰
   */
  deactivateToken: async (userId: string, token: string): Promise<void> => {
    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .update({
        [PUSH_DATABASE.COLUMNS.IS_ACTIVE]: false,
        [PUSH_DATABASE.COLUMNS.UPDATED_AT]: new Date().toISOString(),
      })
      .eq(PUSH_DATABASE.COLUMNS.USER_ID, userId)
      .eq(PUSH_DATABASE.COLUMNS.TOKEN, token);

    if (error) {
      // 비활성화 실패는 무시 (치명적이지 않음)
    }
  },

  /**
   * 사용자의 모든 토큰 삭제
   *
   * 로그아웃 시 호출하여 해당 사용자의 모든 푸시 토큰을 제거합니다.
   *
   * @param userId 사용자 ID
   */
  removeAllTokens: async (userId: string): Promise<void> => {
    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .delete()
      .eq(PUSH_DATABASE.COLUMNS.USER_ID, userId);

    if (error) {
      // 삭제 실패는 무시 (치명적이지 않음)
    }

    // 로컬 토큰도 삭제
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  },

  /**
   * 현재 디바이스 토큰만 삭제
   *
   * 특정 디바이스에서 로그아웃할 때 해당 토큰만 제거합니다.
   *
   * @param userId 사용자 ID
   */
  removeCurrentToken: async (userId: string): Promise<void> => {
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

    if (!storedToken) {
      return;
    }

    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .delete()
      .eq(PUSH_DATABASE.COLUMNS.USER_ID, userId)
      .eq(PUSH_DATABASE.COLUMNS.TOKEN, storedToken);

    if (error) {
      // 삭제 실패는 무시 (치명적이지 않음)
    }

    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  },

  /**
   * 로컬에 저장된 토큰 조회
   *
   * @returns 저장된 Expo Push Token 또는 null
   */
  getStoredToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  },

  /**
   * 푸시 알림 클릭 추적
   *
   * 푸시 알림을 클릭했을 때 clicked_at과 read_at 시간을 기록합니다.
   * 클릭 = 읽음으로 간주합니다.
   *
   * @param notificationId 푸시 알림 ID (push_notifications 테이블의 ID)
   * @param userId 사용자 ID
   */
  trackNotificationClick: async (notificationId: string, userId: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
        .update({
          clicked_at: now,
          read_at: now, // 클릭 시 읽음 처리도 함께 수행
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId);

      if (error) {
        PushLogger.warn('알림 클릭 추적 실패:', error);
      }
    } catch (err) {
      // 클릭 추적 실패는 치명적이지 않으므로 무시
      PushLogger.warn('알림 클릭 추적 에러:', err);
    }
  },

  /**
   * 푸시 알림 읽음 처리
   *
   * 푸시 알림을 수신했을 때 read_at 시간을 기록합니다.
   *
   * @param notificationId 푸시 알림 ID (push_notifications 테이블의 ID)
   * @param userId 사용자 ID
   */
  trackNotificationRead: async (notificationId: string, userId: string): Promise<void> => {
    try {
      const { error } = await supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
        .update({
          read_at: new Date().toISOString(),
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .is('read_at', null); // 이미 읽은 건 업데이트하지 않음

      if (error) {
        PushLogger.warn('알림 읽음 추적 실패:', error);
      }
    } catch (err) {
      // 읽음 추적 실패는 치명적이지 않으므로 무시
      PushLogger.warn('알림 읽음 추적 에러:', err);
    }
  },
};
