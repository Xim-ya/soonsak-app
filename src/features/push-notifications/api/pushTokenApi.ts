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
   * 토큰이 변경된 경우에만 서버에 요청을 보냅니다.
   *
   * @param userId 사용자 ID
   * @param token Expo Push Token
   */
  syncToken: async (userId: string, token: string): Promise<void> => {
    // 로컬 저장된 토큰과 비교
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

    // 기존 토큰이 있고 다르면 비활성화
    if (storedToken && storedToken !== token) {
      await pushTokenApi.deactivateToken(userId, storedToken);
    }

    // 다른 user가 같은 토큰을 가지고 있으면 삭제 (기기는 한 user에만 연결)
    await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .delete()
      .eq(PUSH_DATABASE.COLUMNS.TOKEN, token)
      .neq(PUSH_DATABASE.COLUMNS.USER_ID, userId);

    // device_id 조회 (없으면 생성)
    const deviceId = await getOrCreateDeviceId();

    // 토큰 등록 (upsert) - token이 unique이므로 기존 유저 토큰을 자동으로 덮어씀
    const { error } = await supabaseClient.from(PUSH_DATABASE.TABLES.PUSH_TOKENS).upsert(
      {
        [PUSH_DATABASE.COLUMNS.USER_ID]: userId,
        [PUSH_DATABASE.COLUMNS.TOKEN]: token,
        [PUSH_DATABASE.COLUMNS.PLATFORM]: Platform.OS,
        [PUSH_DATABASE.COLUMNS.DEVICE_ID]: deviceId,
        [PUSH_DATABASE.COLUMNS.IS_ACTIVE]: true,
        [PUSH_DATABASE.COLUMNS.UPDATED_AT]: new Date().toISOString(),
      },
      {
        onConflict: 'token',
      },
    );

    if (error) {
      throw error;
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
};
