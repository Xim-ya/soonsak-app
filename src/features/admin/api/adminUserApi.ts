/**
 * Admin User API
 *
 * 어드민 전용 유저 관리 API
 */

import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { AUTH_DATABASE, PUSH_DATABASE } from '@/features/utils/constants/dbConfig';
import type { UserRole } from '@/features/auth/types';

// ============================================================================
// Types
// ============================================================================

/** 유저 관리 목록 아이템 */
export interface UserManagementItem {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  entryCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  providers: string[];
}

/** 푸시 토큰 정보 */
export interface PushTokenInfo {
  id: string;
  token: string;
  platform: 'ios' | 'android';
  isActive: boolean;
  createdAt: string;
}

/** 유저 상세 아이템 (목록 + 푸시토큰 + 활동 통계) */
export interface UserDetailItem extends UserManagementItem {
  pushTokens: PushTokenInfo[];
  watchHistoryCount: number;
  favoritesCount: number;
  ratingsCount: number;
}

/** 유저 통계 (대시보드용) */
export interface UserStatistics {
  totalUsers: number;
  dailyActiveVisitors: number;
  activePushTokens: number;
}

/** 역할별 유저 카운트 */
export interface UserRoleCounts {
  total: number;
  user: number;
  admin: number;
  banned: number;
}

/** 유저 목록 조회 파라미터 */
export interface UserListParams {
  role: UserRole | 'all';
  searchQuery: string | null;
  searchField: 'email' | 'displayName';
  sortBy: 'createdAt' | 'lastLoginAt' | 'entryCount';
  cursor: string | null;
  limit: number;
}

/** 유저 목록 조회 결과 */
export interface UserListResult {
  users: UserManagementItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

// ============================================================================
// Constants
// ============================================================================

/** 최대 허용 limit 값 */
const MAX_PAGE_LIMIT = 100;
/** 기본 limit 값 */
const DEFAULT_PAGE_LIMIT = 20;
/** 최소 limit 값 */
const MIN_PAGE_LIMIT = 1;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * UUID 형식 검증
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * limit 값 정규화 (범위 내로 제한)
 */
function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < MIN_PAGE_LIMIT) {
    return DEFAULT_PAGE_LIMIT;
  }
  return Math.min(limit, MAX_PAGE_LIMIT);
}

/**
 * 검색어 정규화 (XSS 방지를 위한 특수문자 이스케이프)
 */
function sanitizeSearchQuery(query: string | null): string | null {
  if (!query || typeof query !== 'string') return null;
  const trimmed = query.trim();
  if (trimmed.length === 0) return null;
  // SQL LIKE 특수문자 이스케이프
  return trimmed.replace(/[%_\\]/g, '\\$&');
}

// ============================================================================
// API
// ============================================================================

export const adminUserApi = {
  /**
   * 유저 목록 조회 (무한스크롤, 필터, 검색, 정렬)
   */
  getUsers: async (params: UserListParams): Promise<UserListResult> => {
    const { role, searchQuery, searchField, sortBy, cursor } = params;
    const limit = normalizeLimit(params.limit);
    const sanitizedSearchQuery = sanitizeSearchQuery(searchQuery);

    let query = supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select(
        'id, email, display_name, avatar_url, role, entry_count, created_at, last_login_at, providers',
      );

    // 역할 필터
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    // 검색 필터 (정규화된 검색어 사용)
    if (sanitizedSearchQuery) {
      const searchColumn = searchField === 'email' ? 'email' : 'display_name';
      query = query.ilike(searchColumn, `%${sanitizedSearchQuery}%`);
    }

    // 정렬 (보조 정렬로 id 추가하여 일관성 보장)
    const sortColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'lastLoginAt'
          ? 'last_login_at'
          : 'entry_count';
    query = query
      .order(sortColumn, { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });

    // 커서 기반 페이지네이션
    if (cursor) {
      query = query.lt(sortColumn, cursor);
    }

    // limit은 마지막에 적용
    query = query.limit(limit + 1);

    const { data, error } = await query;

    if (error) {
      console.error('유저 목록 조회 실패:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const hasMore = (data?.length ?? 0) > limit;
    const users = (data ?? []).slice(0, limit);

    // nextCursor 계산 (정렬 기준 컬럼의 마지막 값)
    let nextCursor: string | null = null;
    if (hasMore && users.length > 0) {
      const lastUser = users[users.length - 1]!;
      nextCursor =
        sortBy === 'createdAt'
          ? lastUser.created_at
          : sortBy === 'lastLoginAt'
            ? lastUser.last_login_at
            : String(lastUser.entry_count);
    }

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role as UserRole,
        entryCount: user.entry_count ?? 0,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        providers: (user.providers as string[]) ?? [],
      })),
      hasMore,
      nextCursor,
    };
  },

  /**
   * 역할별 유저 카운트 조회
   */
  getUserRoleCounts: async (): Promise<UserRoleCounts> => {
    // 전체 카운트
    const { count: total, error: totalError } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('전체 유저 카운트 조회 실패:', totalError);
      throw new Error(`Failed to count total users: ${totalError.message}`);
    }

    // 각 역할별 카운트를 병렬로 조회
    const [userResult, adminResult, bannedResult] = await Promise.all([
      supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user'),
      supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin'),
      supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .eq('role', 'banned'),
    ]);

    return {
      total: total ?? 0,
      user: userResult.count ?? 0,
      admin: adminResult.count ?? 0,
      banned: bannedResult.count ?? 0,
    };
  },

  /**
   * 유저 통계 조회 (대시보드용)
   */
  getUserStatistics: async (): Promise<UserStatistics> => {
    // 총 유저 수
    const { count: totalUsers, error: totalError } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('총 유저 수 조회 실패:', totalError);
      throw new Error(`Failed to count total users: ${totalError.message}`);
    }

    // 오늘 방문자 수 (last_login_at이 오늘인 유저)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const { count: dailyActiveVisitors, error: dailyError } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select('*', { count: 'exact', head: true })
      .gte('last_login_at', todayIso);

    if (dailyError) {
      console.error('일일 방문자 수 조회 실패:', dailyError);
      throw new Error(`Failed to count daily visitors: ${dailyError.message}`);
    }

    // 활성 푸시 토큰 수
    const { count: activePushTokens, error: pushError } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (pushError) {
      console.error('활성 푸시 토큰 수 조회 실패:', pushError);
      throw new Error(`Failed to count active push tokens: ${pushError.message}`);
    }

    return {
      totalUsers: totalUsers ?? 0,
      dailyActiveVisitors: dailyActiveVisitors ?? 0,
      activePushTokens: activePushTokens ?? 0,
    };
  },

  /**
   * 유저 상세 조회 (푸시토큰, 활동통계 포함)
   */
  getUserDetail: async (userId: string): Promise<UserDetailItem> => {
    // userId 유효성 검증
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // 유저 기본 정보 조회
    const { data: user, error: userError } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .select(
        'id, email, display_name, avatar_url, role, entry_count, created_at, last_login_at, providers',
      )
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('유저 정보 조회 실패:', userError);
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    // 푸시 토큰 조회
    const { data: pushTokens, error: pushError } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .select('id, token, platform, is_active, created_at')
      .eq('user_id', userId);

    if (pushError) {
      console.error('푸시 토큰 조회 실패:', pushError);
      // 푸시 토큰 조회 실패는 치명적이지 않으므로 빈 배열로 처리
    }

    // 활동 통계 조회 (시청기록, 찜, 평점)
    const [watchHistoryResult, favoritesResult, ratingsResult] = await Promise.all([
      supabaseClient
        .from('watch_histories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseClient
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseClient
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role as UserRole,
      entryCount: user.entry_count ?? 0,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      providers: (user.providers as string[]) ?? [],
      pushTokens: (pushTokens ?? []).map((token) => ({
        id: token.id,
        token: token.token,
        platform: token.platform as 'ios' | 'android',
        isActive: token.is_active,
        createdAt: token.created_at,
      })),
      watchHistoryCount: watchHistoryResult.count ?? 0,
      favoritesCount: favoritesResult.count ?? 0,
      ratingsCount: ratingsResult.count ?? 0,
    };
  },

  /**
   * 유저 역할 변경
   */
  updateUserRole: async (userId: string, newRole: UserRole): Promise<void> => {
    // userId 유효성 검증
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // 역할 유효성 검증
    const validRoles: UserRole[] = ['user', 'admin', 'banned'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(', ')}`);
    }

    const { error } = await supabaseClient
      .from(AUTH_DATABASE.TABLES.PROFILES)
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('유저 역할 변경 실패:', error);
      throw new Error(`Failed to update user role: ${error.message}`);
    }
  },

  /**
   * 개인 푸시 발송 (Expo Push API)
   */
  sendPushNotification: async (
    userId: string,
    title: string,
    body: string,
  ): Promise<{ success: boolean; sentCount: number; failedCount: number }> => {
    // userId 유효성 검증
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // 푸시 알림 내용 검증
    const trimmedTitle = title?.trim() ?? '';
    const trimmedBody = body?.trim() ?? '';

    if (trimmedTitle.length === 0) {
      throw new Error('Push notification title is required');
    }
    if (trimmedBody.length === 0) {
      throw new Error('Push notification body is required');
    }
    if (trimmedTitle.length > 100) {
      throw new Error('Push notification title exceeds maximum length (100 characters)');
    }
    if (trimmedBody.length > 500) {
      throw new Error('Push notification body exceeds maximum length (500 characters)');
    }

    // 유저의 활성 푸시 토큰 조회
    const { data: tokens, error: tokenError } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (tokenError) {
      console.error('푸시 토큰 조회 실패:', tokenError);
      throw new Error(`Failed to fetch push tokens: ${tokenError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    // Expo Push API로 발송 (검증된 값 사용)
    const messages = tokens.map((t) => ({
      to: t.token,
      title: trimmedTitle,
      body: trimmedBody,
      sound: 'default' as const,
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Expo Push API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // 응답 데이터 검증
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from Expo Push API');
      }

      const data = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];

      const sentCount = data.filter(
        (r: { status?: string } | null) => r && typeof r === 'object' && r.status === 'ok',
      ).length;
      const failedCount = data.filter(
        (r: { status?: string } | null) => r && typeof r === 'object' && r.status === 'error',
      ).length;

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Push notification request timed out');
      }
      console.error('푸시 발송 실패:', error);
      throw error;
    }
  },
};
