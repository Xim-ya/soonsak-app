/**
 * User API
 *
 * 프로필 관련 API 함수들을 제공합니다.
 * Supabase를 통해 프로필 조회, 업데이트, 이미지 업로드를 처리합니다.
 */

import { File as ExpoFile } from 'expo-file-system';
import * as Application from 'expo-application';
import { supabaseClient } from '@/shared/api/supabaseClient';
import { mapWithField } from '@/shared/utils/fieldMapper';
import { AUTH_DATABASE } from '@/shared/config/dbConfig';
import { UserLogger } from '@/shared/utils/logger';
import type { ProfileDto } from '@/features/auth/types';
import type { ProfileUpdateDto } from '../types';

/** Storage 버킷 이름 */
const STORAGE_BUCKET = 'profiles';

/** 아바타 저장 경로 */
const AVATAR_PATH = 'avatars';

export const userApi = {
  /**
   * 프로필 조회
   *
   * @param userId 사용자 ID
   * @returns ProfileDto 또는 null
   */
  getProfile: async (userId: string): Promise<ProfileDto | null> => {
    const { data, error } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select('*')
      .eq(AUTH_DATABASE.COLUMNS.ID, userId)
      .maybeSingle();

    if (error) {
      UserLogger.error('프로필 조회 실패:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapWithField<ProfileDto>(data);
  },

  /**
   * 닉네임 중복 체크
   *
   * @param nickname 확인할 닉네임
   * @param excludeUserId 제외할 사용자 ID (본인 닉네임 변경 시)
   * @returns true = 중복됨, false = 사용 가능
   */
  checkNicknameDuplicate: async (nickname: string, excludeUserId?: string): Promise<boolean> => {
    let query = supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select(AUTH_DATABASE.COLUMNS.ID)
      .eq(AUTH_DATABASE.COLUMNS.DISPLAY_NAME, nickname);

    // 본인은 제외
    if (excludeUserId) {
      query = query.neq(AUTH_DATABASE.COLUMNS.ID, excludeUserId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      UserLogger.error('닉네임 중복 체크 실패:', error);
      throw error;
    }

    return data !== null;
  },

  /**
   * 프로필 이미지 업로드
   *
   * Supabase Storage에 이미지를 업로드하고 public URL을 반환합니다.
   * React Native에서는 expo-file-system을 사용하여 base64로 읽어서 업로드합니다.
   *
   * @param userId 사용자 ID
   * @param imageUri 로컬 이미지 URI
   * @returns 업로드된 이미지의 public URL
   */
  uploadProfileImage: async (userId: string, imageUri: string): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.jpg`;
    const filePath = `${AVATAR_PATH}/${fileName}`;

    // 이미지 파일을 ArrayBuffer로 읽기 (expo-file-system 신규 API)
    const file = new ExpoFile(imageUri);
    const arrayBuffer = await file.arrayBuffer();

    // ArrayBuffer로 직접 업로드
    const { error: uploadError } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      UserLogger.error('이미지 업로드 실패:', uploadError);
      throw uploadError;
    }

    // Public URL 생성
    const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * 프로필 업데이트 (없으면 생성)
   *
   * @param userId 사용자 ID
   * @param updates 업데이트할 필드
   */
  updateProfile: async (userId: string, updates: ProfileUpdateDto): Promise<void> => {
    const upsertData: Record<string, unknown> = {
      [AUTH_DATABASE.COLUMNS.ID]: userId,
      [AUTH_DATABASE.COLUMNS.UPDATED_AT]: new Date().toISOString(),
    };

    if (updates.displayName !== undefined) {
      upsertData[AUTH_DATABASE.COLUMNS.DISPLAY_NAME] = updates.displayName;
    }

    if (updates.avatarUrl !== undefined) {
      upsertData[AUTH_DATABASE.COLUMNS.AVATAR_URL] = updates.avatarUrl;
    }

    const { error } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .upsert(upsertData, { onConflict: AUTH_DATABASE.COLUMNS.ID });

    if (error) {
      UserLogger.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 온보딩 완료 여부 확인
   *
   * display_name이 null이 아니면 완료로 판단합니다.
   * 프로필이 존재하지 않으면 온보딩 미완료로 판단합니다.
   *
   * @param userId 사용자 ID
   * @returns 온보딩 완료 여부 (true = 완료, false = 미완료 또는 프로필 없음)
   */
  checkOnboardingComplete: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select(AUTH_DATABASE.COLUMNS.DISPLAY_NAME)
      .eq(AUTH_DATABASE.COLUMNS.ID, userId)
      .maybeSingle(); // .single() 대신 .maybeSingle() 사용 (0개 행 허용)

    if (error) {
      UserLogger.error('온보딩 상태 확인 실패:', error);
      return false; // 에러 시 미완료로 처리
    }

    // 프로필이 없거나 display_name이 null이면 미완료
    if (!data) {
      return false;
    }

    return data.display_name !== null;
  },

  /**
   * 앱 진입 카운트 증가 (로그인 유저용)
   *
   * profiles 테이블의 entry_count를 1 증가시킵니다.
   *
   * @param userId 사용자 ID
   */
  incrementEntryCount: async (userId: string): Promise<void> => {
    UserLogger.log('로그인 유저 진입 카운트 +1');
    UserLogger.log('User ID:', userId);

    try {
      const { error } = await supabaseClient.rpc(AUTH_DATABASE.RPC.INCREMENT_PROFILE_ENTRY_COUNT, {
        p_user_id: userId,
      });

      if (error) throw error;

      UserLogger.log('profiles.entry_count 증가 완료');
    } catch (error) {
      UserLogger.error('진입 카운트 증가 실패:', error);
    }
  },

  /**
   * 마지막 사용 앱 버전 업데이트
   *
   * 앱 실행 시 현재 앱 버전을 profiles.last_used_version에 저장합니다.
   *
   * @param userId 사용자 ID
   */
  updateLastUsedVersion: async (userId: string): Promise<void> => {
    const appVersion = Application.nativeApplicationVersion;

    if (!appVersion) {
      return;
    }

    try {
      const { error } = await supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .update({
          [AUTH_DATABASE.COLUMNS.LAST_USED_VERSION]: appVersion,
          [AUTH_DATABASE.COLUMNS.UPDATED_AT]: new Date().toISOString(),
        })
        .eq(AUTH_DATABASE.COLUMNS.ID, userId)
        .neq(AUTH_DATABASE.COLUMNS.LAST_USED_VERSION, appVersion);

      if (error) throw error;
    } catch (error) {
      // 버전 업데이트 실패는 치명적이지 않으므로 무시
      UserLogger.warn('앱 버전 업데이트 실패:', error);
    }
  },

  /**
   * 앱 진입 정보 조회 (방문 횟수, 마지막 방문 시간)
   *
   * @param userId 사용자 ID
   * @returns { entryCount, lastVisitAt } 또는 null
   */
  getEntryInfo: async (
    userId: string,
  ): Promise<{ entryCount: number; lastVisitAt: string | null } | null> => {
    try {
      const { data, error } = await supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('entry_count, updated_at')
        .eq(AUTH_DATABASE.COLUMNS.ID, userId)
        .single();

      if (error || !data) return null;

      return {
        entryCount: (data.entry_count as number) ?? 0,
        lastVisitAt: data.updated_at as string | null,
      };
    } catch {
      return null;
    }
  },
};
