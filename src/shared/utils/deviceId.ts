/**
 * Device ID 유틸리티
 *
 * 앱 첫 실행 시 고유 디바이스 ID를 생성하고 관리합니다.
 * 비로그인 유저 트래킹 및 push_tokens의 device_id 필드 값으로 사용됩니다.
 *
 * @example
 * // 앱 시작 시 디바이스 등록
 * await getOrCreateDeviceId();
 *
 * // 로그인 시 유저 연결
 * await linkDeviceToUser(userId);
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { DEVICE_DATABASE } from '@/features/utils/constants/dbConfig';

/** AsyncStorage 키: 로컬에 저장된 디바이스 ID */
const DEVICE_ID_STORAGE_KEY = '@soonsak/device_id';

/**
 * Device ID 조회 (없으면 생성 + 원격 저장)
 *
 * AsyncStorage에서 device_id를 확인하고, 없으면 새로 생성하여
 * 로컬과 원격 테이블에 저장합니다.
 *
 * @returns 디바이스 고유 ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
  // 로컬 저장소에서 확인
  const storedId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (storedId) {
    return storedId;
  }

  // 새 UUID 생성
  const newDeviceId = Crypto.randomUUID();

  // AsyncStorage 저장
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);

  // 원격 테이블 저장 (트래킹 용도)
  try {
    const { error } = await supabaseClient.from(DEVICE_DATABASE.TABLES.DEVICES).insert({
      [DEVICE_DATABASE.COLUMNS.DEVICE_ID]: newDeviceId,
      [DEVICE_DATABASE.COLUMNS.PLATFORM]: Platform.OS,
    });

    if (error) {
      throw error;
    }

    if (__DEV__) {
      console.log('[DeviceId] 새 디바이스 등록 완료:', newDeviceId);
    }
  } catch (error) {
    // 원격 저장 실패해도 로컬 ID는 유지 (다음 시도에서 재등록)
    console.error('[DeviceId] 원격 저장 실패:', error);
  }

  return newDeviceId;
}

/**
 * 로그인 시 device를 user에 연결
 *
 * devices 테이블에서 현재 디바이스를 찾아 user_id와 linked_at을 업데이트합니다.
 *
 * @param userId 사용자 ID
 */
export async function linkDeviceToUser(userId: string): Promise<void> {
  const deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) {
    if (__DEV__) {
      console.warn('[DeviceId] 연결할 디바이스 ID가 없음');
    }
    return;
  }

  try {
    const { error } = await supabaseClient
      .from(DEVICE_DATABASE.TABLES.DEVICES)
      .update({
        [DEVICE_DATABASE.COLUMNS.USER_ID]: userId,
        [DEVICE_DATABASE.COLUMNS.LINKED_AT]: new Date().toISOString(),
        [DEVICE_DATABASE.COLUMNS.UPDATED_AT]: new Date().toISOString(),
      })
      .eq(DEVICE_DATABASE.COLUMNS.DEVICE_ID, deviceId);

    if (error) {
      throw error;
    }

    // 비로그인 시 누적된 entry_count를 profiles로 이전
    await transferEntryCountToUser(userId);

    if (__DEV__) {
      console.log('[DeviceId] 유저 연결 완료:', { deviceId, userId });
    }
  } catch (error) {
    // 연결 실패는 치명적이지 않음
    console.error('[DeviceId] 유저 연결 실패:', error);
  }
}

/**
 * 현재 저장된 Device ID 조회
 *
 * @returns 저장된 디바이스 ID 또는 null
 */
export async function getStoredDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
}

/**
 * 앱 진입 카운트 증가 (비로그인 유저용)
 *
 * devices 테이블의 entry_count를 1 증가시킵니다.
 */
export async function incrementDeviceEntryCount(): Promise<void> {
  const deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) {
    console.log('[EntryCount] 디바이스 ID 없음, 카운트 스킵');
    return;
  }

  console.log('[EntryCount] 비로그인 유저 진입 카운트 +1');
  console.log('[EntryCount] Device ID:', deviceId);

  try {
    const { error } = await supabaseClient.rpc(DEVICE_DATABASE.RPC.INCREMENT_DEVICE_ENTRY_COUNT, {
      p_device_id: deviceId,
    });

    if (error) throw error;

    console.log('[EntryCount] devices.entry_count 증가 완료');
  } catch (error) {
    console.error('[EntryCount] 진입 카운트 증가 실패:', error);
  }
}

/**
 * 비로그인 → 로그인 전환 시 entry_count 이전
 *
 * devices 테이블의 entry_count를 profiles 테이블로 이전하고,
 * devices의 entry_count를 0으로 초기화합니다.
 *
 * @param userId 사용자 ID
 */
export async function transferEntryCountToUser(userId: string): Promise<void> {
  const deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!deviceId) return;

  console.log('[EntryCount] 비로그인 → 로그인 카운트 이전 시작');
  console.log('[EntryCount] Device ID:', deviceId);
  console.log('[EntryCount] User ID:', userId);

  try {
    const { error } = await supabaseClient.rpc(DEVICE_DATABASE.RPC.TRANSFER_DEVICE_ENTRY_COUNT, {
      p_device_id: deviceId,
      p_user_id: userId,
    });

    if (error) throw error;

    console.log('[EntryCount] devices → profiles 카운트 이전 완료');
  } catch (error) {
    console.error('[EntryCount] 카운트 이전 실패:', error);
  }
}
