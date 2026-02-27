/**
 * Admin User API
 *
 * 어드민 전용 유저 관리 API
 */

import { supabaseClient } from '@/features/utils/clients/superBaseClient';
import { AUTH_DATABASE, PUSH_DATABASE } from '@/features/utils/constants/dbConfig';
import type { UserRole } from '@/features/auth/types';
import type { PushData } from '../types/pushAction';

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
  /** 총 가입자 수 */
  totalUsers: number;
  /** 오늘 총 DAU (회원 + 비회원) */
  totalDau: number;
  /** 오늘 회원 DAU */
  memberDau: number;
  /** 오늘 비회원 DAU */
  nonMemberDau: number;
  /** 오늘 신규 가입자 */
  newUsersToday: number;
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

/** 유저 콘텐츠 아이템 (시청기록/찜/평가) */
export interface UserContentItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  contentTitle: string;
  contentPosterPath: string | null;
  createdAt: string;
  /** 평가 점수 (ratings에만 존재) */
  rating?: number;
  /** 시청 진행률 퍼센트 (watch_history에만 존재) */
  progressPercent?: number;
  /** 시청 진행 시간 초 (watch_history에만 존재) */
  progressSeconds?: number;
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

    // 개별 쿼리 에러 로깅 (치명적이지 않으므로 경고만)
    if (userResult.error) {
      console.warn('user 역할 카운트 조회 실패:', userResult.error);
    }
    if (adminResult.error) {
      console.warn('admin 역할 카운트 조회 실패:', adminResult.error);
    }
    if (bannedResult.error) {
      console.warn('banned 역할 카운트 조회 실패:', bannedResult.error);
    }

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
    // 오늘 자정 (UTC 기준)
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const todayIso = todayStart.toISOString();

    // 병렬로 모든 통계 조회
    const [totalResult, memberDauResult, nonMemberDauResult, newUsersResult] = await Promise.all([
      // 총 가입자 수
      supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('*', { count: 'exact', head: true }),
      // 회원 DAU (오늘 로그인한 회원)
      supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', todayIso),
      // 비회원 DAU (오늘 접속한 비회원 - user_id가 NULL인 devices)
      supabaseClient
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .gte('updated_at', todayIso),
      // 오늘 신규 가입자
      supabaseClient
        .from(AUTH_DATABASE.TABLES.PROFILES)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayIso),
    ]);

    // 에러 로깅 (치명적이지 않으므로 경고만)
    if (totalResult.error) {
      console.warn('총 유저 수 조회 실패:', totalResult.error);
    }
    if (memberDauResult.error) {
      console.warn('회원 DAU 조회 실패:', memberDauResult.error);
    }
    if (nonMemberDauResult.error) {
      console.warn('비회원 DAU 조회 실패:', nonMemberDauResult.error);
    }
    if (newUsersResult.error) {
      console.warn('신규 가입자 조회 실패:', newUsersResult.error);
    }

    const memberDau = memberDauResult.count ?? 0;
    const nonMemberDau = nonMemberDauResult.count ?? 0;

    return {
      totalUsers: totalResult.count ?? 0,
      totalDau: memberDau + nonMemberDau,
      memberDau,
      nonMemberDau,
      newUsersToday: newUsersResult.count ?? 0,
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
        .from('watch_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseClient
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseClient
        .from('content_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('rating', 0),
    ]);

    // 부분 실패 로깅 (치명적이지 않으므로 경고만)
    if (watchHistoryResult.error) {
      console.warn('시청기록 통계 조회 실패:', watchHistoryResult.error);
    }
    if (favoritesResult.error) {
      console.warn('찜 통계 조회 실패:', favoritesResult.error);
    }
    if (ratingsResult.error) {
      console.warn('평가 통계 조회 실패:', ratingsResult.error);
    }

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
   *
   * @param userId - 발송 대상 유저 ID
   * @param title - 푸시 알림 제목
   * @param body - 푸시 알림 내용
   * @param data - 딥링크 데이터 (선택)
   */
  sendPushNotification: async (
    userId: string,
    title: string,
    body: string,
    data?: PushData,
  ): Promise<{ success: boolean; sentCount: number; failedCount: number }> => {
    // userId 유효성 검증
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    // 푸시 알림 내용 검증
    const trimmedTitle = title?.trim() ?? '';
    const trimmedBody = body?.trim() ?? '';

    // body는 필수, title은 선택적 (없으면 앱 이름이 표시됨)
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
      // title이 있을 때만 포함 (없으면 앱 이름 표시)
      ...(trimmedTitle.length > 0 && { title: trimmedTitle }),
      body: trimmedBody,
      sound: 'default' as const,
      // 딥링크 데이터 포함 (있을 경우)
      ...(data && { data }),
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

      const resultData = Array.isArray(result.data)
        ? result.data
        : result.data
          ? [result.data]
          : [];

      const sentCount = resultData.filter(
        (r: { status?: string } | null) => r && typeof r === 'object' && r.status === 'ok',
      ).length;
      const failedCount = resultData.filter(
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

  /**
   * 유저의 시청기록 조회 (어드민용)
   */
  getUserWatchHistory: async (userId: string, limit: number = 50): Promise<UserContentItem[]> => {
    if (!userId || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    const { data, error } = await supabaseClient
      .from('watch_history')
      .select(
        `
        *,
        contents!watch_history_content_fkey (
          title,
          poster_path
        )
      `,
      )
      .eq('user_id', userId)
      .order('last_watched_at', { ascending: false })
      .limit(normalizeLimit(limit));

    if (error) {
      console.error('시청기록 조회 실패:', error);
      throw new Error(`Failed to fetch watch history: ${error.message}`);
    }

    type ContentJoin = { title?: string; poster_path?: string } | null;

    return (data ?? []).map((item) => {
      const content = item.contents as ContentJoin;
      const progressSeconds = item.progress_seconds ?? 0;
      const durationSeconds = item.duration_seconds ?? 1;
      // 0으로 나누기 방지
      const safeDuration = durationSeconds > 0 ? durationSeconds : 1;
      return {
        contentId: item.content_id as number,
        contentType: item.content_type as 'movie' | 'tv',
        contentTitle: content?.title ?? '알 수 없음',
        contentPosterPath: content?.poster_path ?? null,
        createdAt: item.created_at as string,
        progressPercent: Math.round((progressSeconds / safeDuration) * 100),
        progressSeconds,
      };
    });
  },

  /**
   * 유저의 찜 목록 조회 (어드민용)
   */
  getUserFavorites: async (userId: string, limit: number = 50): Promise<UserContentItem[]> => {
    if (!userId || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    const { data, error } = await supabaseClient
      .from('favorites')
      .select(
        `
        *,
        contents!favorites_content_fkey (
          title,
          poster_path
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(normalizeLimit(limit));

    if (error) {
      console.error('찜 목록 조회 실패:', error);
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    type ContentJoin = { title?: string; poster_path?: string } | null;

    return (data ?? []).map((item) => {
      const content = item.contents as ContentJoin;
      return {
        contentId: item.content_id as number,
        contentType: item.content_type as 'movie' | 'tv',
        contentTitle: content?.title ?? '알 수 없음',
        contentPosterPath: content?.poster_path ?? null,
        createdAt: item.created_at as string,
      };
    });
  },

  /**
   * 유저의 평가 목록 조회 (어드민용)
   */
  getUserRatings: async (userId: string, limit: number = 50): Promise<UserContentItem[]> => {
    if (!userId || !isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }

    const { data, error } = await supabaseClient
      .from('content_ratings')
      .select(
        `
        *,
        contents!content_ratings_content_fkey (
          title,
          poster_path
        )
      `,
      )
      .eq('user_id', userId)
      .gt('rating', 0)
      .order('created_at', { ascending: false })
      .limit(normalizeLimit(limit));

    if (error) {
      console.error('평가 목록 조회 실패:', error);
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    type ContentJoin = { title?: string; poster_path?: string } | null;

    return (data ?? []).map((item) => {
      const content = item.contents as ContentJoin;
      return {
        contentId: item.content_id as number,
        contentType: item.content_type as 'movie' | 'tv',
        contentTitle: content?.title ?? '알 수 없음',
        contentPosterPath: content?.poster_path ?? null,
        createdAt: item.created_at as string,
        rating: item.rating as number,
      };
    });
  },
};
