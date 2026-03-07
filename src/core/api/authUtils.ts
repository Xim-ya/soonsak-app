/**
 * 인증 관련 유틸리티 함수
 * Supabase 인증 상태 확인을 위한 공통 함수
 */

import type { User } from '@supabase/supabase-js';
import { supabaseClient } from './supabaseClient';

/**
 * 인증된 사용자 정보 반환
 * @returns 미인증 시 null
 */
export async function getAuthUser(): Promise<User | null> {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    return null;
  }
  return data.user ?? null;
}

/**
 * 인증된 사용자 정보 반환 (인증 필수)
 * @throws 미인증 시 에러
 */
export async function requireAuth(): Promise<User> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}
