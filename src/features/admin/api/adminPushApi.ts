/**
 * Admin Push API
 *
 * 어드민 전용 푸시 알림 템플릿/스케줄 관리 API
 */

import { supabaseClient } from '@/shared/api/supabaseClient';
import { PUSH_DATABASE } from '@/shared/config/dbConfig';
import type { PushData } from '../types/pushAction';

// ============================================================================
// Types
// ============================================================================

/** 푸시 알림 타입 */
export type PushNotificationType =
  | 'new_content'
  | 'new_video'
  | 'content_update'
  | 'channel_update'
  | 'system'
  | 'marketing'
  | 'reminder'
  | 'recommendation'
  | 'review';

/** 푸시 우선순위 */
export type PushPriority = 'high' | 'normal' | 'low';

/** 푸시 액션 타입 */
export type PushActionType =
  | 'none'
  | 'nav_content'
  | 'nav_player'
  | 'nav_channel'
  | 'nav_search'
  | 'nav_settings'
  | 'nav_userlist'
  | 'action_settings'
  | 'action_refresh';

/** 푸시 타겟 타입 */
export type PushTargetType = 'all' | 'segment' | 'personalized' | 'specific';

/** 푸시 스케줄 상태 */
export type PushScheduleStatus =
  | 'draft'
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'cancelled'
  | 'failed';

/** 푸시 반복 타입 */
export type PushRecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

/** 푸시 발송 상태 */
export type PushDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';

/** 푸시 템플릿 목록 아이템 */
export interface PushTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  notificationType: PushNotificationType;
  titleTemplate: string;
  bodyTemplate: string;
  bodyVariants: string[];
  priority: PushPriority;
  actionType: PushActionType;
  targetType: PushTargetType;
  scheduleStatus: PushScheduleStatus;
  scheduledAt: string | null;
  recurrenceType: PushRecurrenceType;
  nextRunAt: string | null;
  lastRunAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 푸시 템플릿 상세 (수정용) */
export interface PushTemplateDetail extends PushTemplateListItem {
  imageUrl: string | null;
  defaultData: Record<string, unknown>;
  targetSegment: Record<string, unknown> | null;
  recurrenceRule: string | null;
  recurrenceEndAt: string | null;
  retryCount: number;
  maxRetries: number;
}

/** 푸시 템플릿 생성/수정 파라미터 */
export interface PushTemplateParams {
  name: string;
  description?: string | null;
  notificationType: PushNotificationType;
  titleTemplate: string;
  bodyTemplate: string;
  bodyVariants?: string[];
  imageUrl?: string | null;
  priority?: PushPriority;
  actionType?: PushActionType;
  defaultData?: Record<string, unknown>;
  targetType: PushTargetType;
  targetSegment?: Record<string, unknown> | null;
  scheduledAt?: string | null;
  recurrenceType?: PushRecurrenceType;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
  isActive?: boolean;
}

/** 푸시 알림 발송 내역 아이템 */
export interface PushNotificationItem {
  id: string;
  templateId: string | null;
  notificationType: PushNotificationType;
  title: string;
  body: string;
  actionType: PushActionType;
  isBroadcast: boolean;
  createdAt: string;
}

/** 푸시 발송 결과 아이템 (기본) */
export interface PushReceiptItem {
  id: string;
  notificationId: string;
  userId: string;
  deliveryStatus: PushDeliveryStatus;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

/** 푸시 발송 내역 아이템 (유저 정보 포함) */
export interface PushReceiptWithUserItem {
  id: string;
  /** 유저 정보 */
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
  /** 푸시 내용 */
  notificationId: string;
  title: string;
  body: string;
  notificationType: PushNotificationType;
  actionType: PushActionType;
  /** 상태 */
  deliveryStatus: PushDeliveryStatus;
  readAt: string | null;
  clickedAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

/** 푸시 발송 내역 조회 파라미터 */
export interface PushReceiptListParams {
  /** 유저 이름 검색어 */
  searchQuery?: string | null;
  /** 커서 (페이지네이션) */
  cursor?: string | null;
  /** 페이지 크기 */
  limit?: number;
}

/** 푸시 발송 내역 조회 결과 */
export interface PushReceiptListResult {
  receipts: PushReceiptWithUserItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** 푸시 통계 */
export interface PushStatistics {
  /** 총 템플릿 수 */
  totalTemplates: number;
  /** 활성 템플릿 수 */
  activeTemplates: number;
  /** 예약된 템플릿 수 */
  scheduledTemplates: number;
  /** 오늘 발송된 푸시 수 */
  sentToday: number;
  /** 총 활성 푸시 토큰 수 */
  activePushTokens: number;
}

// ============================================================================
// API
// ============================================================================

export const adminPushApi = {
  /**
   * 푸시 템플릿 목록 조회
   */
  getTemplates: async (): Promise<PushTemplateListItem[]> => {
    const { data, error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
      .select(
        `
        id,
        name,
        description,
        notification_type,
        title_template,
        body_template,
        body_variants,
        priority,
        action_type,
        target_type,
        schedule_status,
        scheduled_at,
        recurrence_type,
        next_run_at,
        last_run_at,
        is_active,
        created_at,
        updated_at
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('푸시 템플릿 목록 조회 실패:', error);
      throw new Error(`Failed to fetch push templates: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      notificationType: item.notification_type as PushNotificationType,
      titleTemplate: item.title_template,
      bodyTemplate: item.body_template,
      bodyVariants: (item.body_variants as string[]) ?? [],
      priority: item.priority as PushPriority,
      actionType: item.action_type as PushActionType,
      targetType: item.target_type as PushTargetType,
      scheduleStatus: item.schedule_status as PushScheduleStatus,
      scheduledAt: item.scheduled_at,
      recurrenceType: item.recurrence_type as PushRecurrenceType,
      nextRunAt: item.next_run_at,
      lastRunAt: item.last_run_at,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  /**
   * 푸시 템플릿 상세 조회
   */
  getTemplateDetail: async (templateId: string): Promise<PushTemplateDetail> => {
    const { data, error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('푸시 템플릿 상세 조회 실패:', error);
      throw new Error(`Failed to fetch push template: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      notificationType: data.notification_type as PushNotificationType,
      titleTemplate: data.title_template,
      bodyTemplate: data.body_template,
      bodyVariants: (data.body_variants as string[]) ?? [],
      imageUrl: data.image_url,
      priority: data.priority as PushPriority,
      actionType: data.action_type as PushActionType,
      defaultData: (data.default_data as Record<string, unknown>) ?? {},
      targetType: data.target_type as PushTargetType,
      targetSegment: data.target_segment as Record<string, unknown> | null,
      scheduleStatus: data.schedule_status as PushScheduleStatus,
      scheduledAt: data.scheduled_at,
      recurrenceType: data.recurrence_type as PushRecurrenceType,
      recurrenceRule: data.recurrence_rule,
      recurrenceEndAt: data.recurrence_end_at,
      nextRunAt: data.next_run_at,
      lastRunAt: data.last_run_at,
      retryCount: data.retry_count ?? 0,
      maxRetries: data.max_retries ?? 3,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * 푸시 템플릿 생성
   */
  createTemplate: async (params: PushTemplateParams): Promise<string> => {
    const { data, error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
      .insert({
        name: params.name,
        description: params.description ?? null,
        notification_type: params.notificationType,
        title_template: params.titleTemplate,
        body_template: params.bodyTemplate,
        body_variants: params.bodyVariants ?? [],
        image_url: params.imageUrl ?? null,
        priority: params.priority ?? 'normal',
        action_type: params.actionType ?? 'none',
        default_data: params.defaultData ?? {},
        target_type: params.targetType,
        target_segment: params.targetSegment ?? null,
        schedule_status: params.scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: params.scheduledAt ?? null,
        recurrence_type: params.recurrenceType ?? 'none',
        recurrence_rule: params.recurrenceRule ?? null,
        recurrence_end_at: params.recurrenceEndAt ?? null,
        next_run_at: params.scheduledAt ?? null,
        is_active: params.isActive ?? true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('푸시 템플릿 생성 실패:', error);
      throw new Error(`Failed to create push template: ${error.message}`);
    }

    return data.id;
  },

  /**
   * 푸시 템플릿 수정
   */
  updateTemplate: async (
    templateId: string,
    params: Partial<PushTemplateParams>,
  ): Promise<void> => {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.name !== undefined) updateData['name'] = params.name;
    if (params.description !== undefined) updateData['description'] = params.description;
    if (params.notificationType !== undefined)
      updateData['notification_type'] = params.notificationType;
    if (params.titleTemplate !== undefined) updateData['title_template'] = params.titleTemplate;
    if (params.bodyTemplate !== undefined) updateData['body_template'] = params.bodyTemplate;
    if (params.bodyVariants !== undefined) updateData['body_variants'] = params.bodyVariants;
    if (params.imageUrl !== undefined) updateData['image_url'] = params.imageUrl;
    if (params.priority !== undefined) updateData['priority'] = params.priority;
    if (params.actionType !== undefined) updateData['action_type'] = params.actionType;
    if (params.defaultData !== undefined) updateData['default_data'] = params.defaultData;
    if (params.targetType !== undefined) updateData['target_type'] = params.targetType;
    if (params.targetSegment !== undefined) updateData['target_segment'] = params.targetSegment;
    if (params.scheduledAt !== undefined) {
      updateData['scheduled_at'] = params.scheduledAt;
      updateData['next_run_at'] = params.scheduledAt;
      updateData['schedule_status'] = params.scheduledAt ? 'scheduled' : 'draft';
    }
    if (params.recurrenceType !== undefined) updateData['recurrence_type'] = params.recurrenceType;
    if (params.recurrenceRule !== undefined) updateData['recurrence_rule'] = params.recurrenceRule;
    if (params.recurrenceEndAt !== undefined)
      updateData['recurrence_end_at'] = params.recurrenceEndAt;
    if (params.isActive !== undefined) updateData['is_active'] = params.isActive;

    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
      .update(updateData)
      .eq('id', templateId);

    if (error) {
      console.error('푸시 템플릿 수정 실패:', error);
      throw new Error(`Failed to update push template: ${error.message}`);
    }
  },

  /**
   * 푸시 템플릿 삭제
   */
  deleteTemplate: async (templateId: string): Promise<void> => {
    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('푸시 템플릿 삭제 실패:', error);
      throw new Error(`Failed to delete push template: ${error.message}`);
    }
  },

  /**
   * 푸시 템플릿 스케줄 상태 변경
   */
  updateTemplateScheduleStatus: async (
    templateId: string,
    status: PushScheduleStatus,
  ): Promise<void> => {
    const { error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
      .update({
        schedule_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) {
      console.error('푸시 템플릿 스케줄 상태 변경 실패:', error);
      throw new Error(`Failed to update template schedule status: ${error.message}`);
    }
  },

  /**
   * 푸시 통계 조회
   */
  getStatistics: async (): Promise<PushStatistics> => {
    // 오늘 자정 (UTC 기준)
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const todayIso = todayStart.toISOString();

    const [
      totalTemplatesResult,
      activeTemplatesResult,
      scheduledTemplatesResult,
      sentTodayResult,
      activePushTokensResult,
    ] = await Promise.all([
      // 총 템플릿 수
      supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
        .select('*', { count: 'exact', head: true }),
      // 활성 템플릿 수
      supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      // 예약된 템플릿 수
      supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_TEMPLATES)
        .select('*', { count: 'exact', head: true })
        .eq('schedule_status', 'scheduled'),
      // 오늘 발송된 푸시 수
      supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATIONS)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayIso),
      // 활성 푸시 토큰 수
      supabaseClient
        .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    return {
      totalTemplates: totalTemplatesResult.count ?? 0,
      activeTemplates: activeTemplatesResult.count ?? 0,
      scheduledTemplates: scheduledTemplatesResult.count ?? 0,
      sentToday: sentTodayResult.count ?? 0,
      activePushTokens: activePushTokensResult.count ?? 0,
    };
  },

  /**
   * 최근 발송 내역 조회
   */
  getRecentNotifications: async (limit: number = 20): Promise<PushNotificationItem[]> => {
    const { data, error } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATIONS)
      .select(
        `
        id,
        template_id,
        notification_type,
        title,
        body,
        action_type,
        is_broadcast,
        created_at
      `,
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('최근 발송 내역 조회 실패:', error);
      throw new Error(`Failed to fetch recent notifications: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      templateId: item.template_id,
      notificationType: item.notification_type as PushNotificationType,
      title: item.title,
      body: item.body,
      actionType: item.action_type as PushActionType,
      isBroadcast: item.is_broadcast,
      createdAt: item.created_at,
    }));
  },

  /**
   * 푸시 발송 내역 조회 (유저 정보 포함, 검색/페이지네이션)
   */
  getReceiptsWithUser: async (
    params: PushReceiptListParams = {},
  ): Promise<PushReceiptListResult> => {
    const { searchQuery, cursor, limit = 30 } = params;
    const normalizedLimit = Math.min(Math.max(limit, 1), 100);

    // 1단계: receipts + notification 조회 (foreign key 관계 있음)
    let query = supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
      .select(
        `
        id,
        user_id,
        notification_id,
        delivery_status,
        read_at,
        clicked_at,
        sent_at,
        created_at,
        push_notifications!push_notification_receipts_notification_id_fkey (
          title,
          body,
          notification_type,
          action_type
        )
      `,
      )
      .order('created_at', { ascending: false });

    // 커서 기반 페이지네이션
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // 충분한 데이터를 가져와서 검색 필터링 후에도 페이지 크기 유지
    const fetchLimit = searchQuery ? normalizedLimit * 3 : normalizedLimit + 1;
    query = query.limit(fetchLimit);

    const { data, error } = await query;

    if (error) {
      console.error('푸시 발송 내역 조회 실패:', error);
      throw new Error(`Failed to fetch push receipts: ${error.message}`);
    }

    const receiptsData = data ?? [];

    // 2단계: 유저 ID 목록 추출 및 프로필 조회
    const userIds = [...new Set(receiptsData.map((item) => item.user_id))];
    const profilesMap = new Map<
      string,
      { display_name: string | null; email: string | null; avatar_url: string | null }
    >();

    if (userIds.length > 0) {
      const { data: profilesData } = await supabaseClient
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .in('id', userIds);

      if (profilesData) {
        profilesData.forEach((profile) => {
          profilesMap.set(profile.id, {
            display_name: profile.display_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
          });
        });
      }
    }

    // 3단계: 유저 이름 검색 필터 (클라이언트 사이드)
    let filteredData = receiptsData;
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.trim().toLowerCase();
      filteredData = filteredData.filter((item) => {
        const profile = profilesMap.get(item.user_id);
        const displayName = profile?.display_name?.toLowerCase() ?? '';
        const email = profile?.email?.toLowerCase() ?? '';
        return displayName.includes(searchLower) || email.includes(searchLower);
      });
    }

    const hasMore = filteredData.length > normalizedLimit;
    const receipts = filteredData.slice(0, normalizedLimit);

    // nextCursor 계산
    let nextCursor: string | null = null;
    if (hasMore && receipts.length > 0) {
      const lastItem = receipts[receipts.length - 1];
      nextCursor = lastItem?.created_at ?? null;
    }

    return {
      receipts: receipts.map((item) => {
        const notification = item.push_notifications as {
          title?: string;
          body?: string;
          notification_type?: string;
          action_type?: string;
        } | null;
        const profile = profilesMap.get(item.user_id);

        return {
          id: item.id,
          userId: item.user_id,
          userDisplayName: profile?.display_name ?? null,
          userEmail: profile?.email ?? null,
          userAvatarUrl: profile?.avatar_url ?? null,
          notificationId: item.notification_id,
          title: notification?.title ?? '',
          body: notification?.body ?? '',
          notificationType: (notification?.notification_type ?? 'system') as PushNotificationType,
          actionType: (notification?.action_type ?? 'none') as PushActionType,
          deliveryStatus: item.delivery_status as PushDeliveryStatus,
          readAt: item.read_at,
          clickedAt: item.clicked_at,
          sentAt: item.sent_at,
          createdAt: item.created_at,
        };
      }),
      hasMore,
      nextCursor,
    };
  },

  /**
   * 활성 푸시 토큰의 앱 버전 목록 조회
   *
   * profiles.last_used_version 기준으로 버전별 토큰 수를 반환합니다.
   *
   * @returns 버전별 토큰 수 배열
   */
  getAvailableAppVersions: async (): Promise<
    Array<{ version: string | null; count: number }>
  > => {
    // 1. 활성 푸시 토큰과 user_id 조회
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .select('id, user_id')
      .eq('is_active', true);

    if (tokenError) {
      console.error('활성 토큰 조회 실패:', tokenError);
      return [];
    }

    if (!tokenData || tokenData.length === 0) {
      return [];
    }

    // 2. 유저 ID 목록 추출
    const userIds = [...new Set(tokenData.map((t) => t.user_id).filter(Boolean))];

    if (userIds.length === 0) {
      return [];
    }

    // 3. 유저별 last_used_version 조회
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, last_used_version')
      .in('id', userIds);

    if (profileError) {
      console.error('프로필 버전 조회 실패:', profileError);
      return [];
    }

    // 유저 ID -> 버전 매핑
    const userVersionMap = new Map<string, string | null>();
    for (const profile of profileData ?? []) {
      userVersionMap.set(profile.id, profile.last_used_version as string | null);
    }

    // 버전별 토큰 수 집계 (각 토큰의 user_id로 버전 조회)
    const versionCounts = new Map<string | null, number>();
    for (const token of tokenData) {
      const version = userVersionMap.get(token.user_id) ?? null;
      versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
    }

    // 배열로 변환 후 정렬 (null은 마지막으로)
    return Array.from(versionCounts.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => {
        if (a.version === null) return 1;
        if (b.version === null) return -1;
        return b.version.localeCompare(a.version); // 내림차순
      });
  },

  /**
   * 전체 푸시 발송 (활성 토큰에 발송)
   *
   * @param title - 푸시 알림 제목
   * @param body - 푸시 알림 내용
   * @param data - 딥링크 데이터 (선택)
   * @param appVersion - 특정 앱 버전만 대상 (선택, null이면 버전 미지정 유저만)
   */
  sendBroadcastPush: async (
    title: string,
    body: string,
    data?: PushData,
    appVersion?: string | null,
  ): Promise<{ success: boolean; sentCount: number; failedCount: number; totalTokens: number }> => {
    // 푸시 알림 내용 검증
    const trimmedTitle = title?.trim() ?? '';
    const trimmedBody = body?.trim() ?? '';

    if (trimmedBody.length === 0) {
      throw new Error('Push notification body is required');
    }
    if (trimmedTitle.length > 100) {
      throw new Error('Push notification title exceeds maximum length (100 characters)');
    }
    if (trimmedBody.length > 500) {
      throw new Error('Push notification body exceeds maximum length (500 characters)');
    }

    // 앱 버전 필터가 있는 경우: profiles.last_used_version 기준으로 유저 필터링
    let targetUserIds: string[] | null = null;

    if (appVersion !== undefined) {
      // 버전별 유저 ID 조회
      let profileQuery = supabaseClient.from('profiles').select('id');

      if (appVersion === null) {
        // null인 경우: 버전 미지정 유저만
        profileQuery = profileQuery.is('last_used_version', null);
      } else {
        // 특정 버전만
        profileQuery = profileQuery.eq('last_used_version', appVersion);
      }

      const { data: profileData, error: profileError } = await profileQuery;

      if (profileError) {
        console.error('프로필 조회 실패:', profileError);
        throw new Error(`Failed to fetch profiles: ${profileError.message}`);
      }

      targetUserIds = (profileData ?? []).map((p) => p.id);

      if (targetUserIds.length === 0) {
        return { success: false, sentCount: 0, failedCount: 0, totalTokens: 0 };
      }
    }

    // 활성 푸시 토큰 조회 (유저 필터 적용)
    let tokenQuery = supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_TOKENS)
      .select('id, token, user_id')
      .eq('is_active', true);

    // 유저 ID 필터 적용
    if (targetUserIds !== null) {
      tokenQuery = tokenQuery.in('user_id', targetUserIds);
    }

    const { data: tokens, error: tokenError } = await tokenQuery;

    if (tokenError) {
      console.error('푸시 토큰 조회 실패:', tokenError);
      throw new Error(`Failed to fetch push tokens: ${tokenError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return { success: false, sentCount: 0, failedCount: 0, totalTokens: 0 };
    }

    // action_type 매핑
    let actionType = 'none';
    let contentId: number | null = null;
    let contentType: string | null = null;

    const screenToActionType: Record<string, string> = {
      ContentDetail: 'nav_content',
      Player: 'nav_player',
      ChannelDetail: 'nav_channel',
      Search: 'nav_search',
      Settings: 'nav_settings',
      UserContentList: 'nav_userlist',
      ReviewFunnel: 'nav_review_funnel',
    };

    const actionToActionType: Record<string, string> = {
      OPEN_SETTINGS: 'action_settings',
      REFRESH_DATA: 'action_refresh',
    };

    if (data?.action) {
      if (data.action.type === 'NAVIGATION') {
        const navAction = data.action;
        actionType = screenToActionType[navAction.screen] ?? 'none';
        if (navAction.screen === 'ContentDetail') {
          const params = navAction.params as { id?: number; type?: string };
          contentId = params.id ?? null;
          contentType = params.type ?? null;
        }
      } else if (data.action.type === 'ACTION') {
        actionType = actionToActionType[data.action.action] ?? 'none';
      }
    }

    // push_notifications 테이블에 발송 기록 생성 (broadcast)
    const userIds = [...new Set(tokens.map((t) => t.user_id).filter(Boolean))];
    const { data: notification, error: notificationError } = await supabaseClient
      .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATIONS)
      .insert({
        notification_type: 'system',
        title: trimmedTitle || '순삭',
        body: trimmedBody,
        data: data ?? null,
        action_type: actionType,
        content_id: contentId,
        content_type: contentType,
        user_id: null, // broadcast는 특정 유저 대상이 아님
        is_broadcast: true,
        target_user_ids: userIds,
      })
      .select('id')
      .single();

    if (notificationError) {
      console.error('푸시 알림 기록 생성 실패:', notificationError);
    }

    const notificationId = notification?.id;

    // Expo Push API로 발송 (배치 처리, 100개씩)
    const BATCH_SIZE = 100;
    let totalSentCount = 0;
    let totalFailedCount = 0;

    const pushData = data
      ? { ...data, _notificationId: notificationId }
      : notificationId
        ? { _notificationId: notificationId }
        : undefined;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map((t) => ({
        to: t.token,
        ...(trimmedTitle.length > 0 && { title: trimmedTitle }),
        body: trimmedBody,
        sound: 'default' as const,
        ...(pushData && { data: pushData }),
      }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

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
          totalFailedCount += batch.length;
          continue;
        }

        const result = await response.json();
        const resultData = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];

        // push_notification_receipts 테이블에 수신 기록 생성
        if (notificationId) {
          const now = new Date().toISOString();
          const receipts = batch.map((token, index) => {
            const ticketResult = resultData[index] as {
              status?: string;
              id?: string;
              message?: string;
              details?: { error?: string };
            } | null;
            const isSuccess = ticketResult?.status === 'ok';

            return {
              notification_id: notificationId,
              user_id: token.user_id,
              push_token_id: token.id,
              expo_ticket_id: ticketResult?.id ?? null,
              delivery_status: isSuccess ? 'sent' : 'failed',
              error_code: ticketResult?.details?.error ?? null,
              error_message: isSuccess ? null : (ticketResult?.message ?? null),
              sent_at: isSuccess ? now : null,
            };
          });

          await supabaseClient
            .from(PUSH_DATABASE.TABLES.PUSH_NOTIFICATION_RECEIPTS)
            .insert(receipts);
        }

        const batchSentCount = resultData.filter(
          (r: { status?: string } | null) => r && typeof r === 'object' && r.status === 'ok',
        ).length;
        const batchFailedCount = resultData.filter(
          (r: { status?: string } | null) => r && typeof r === 'object' && r.status === 'error',
        ).length;

        totalSentCount += batchSentCount;
        totalFailedCount += batchFailedCount;
      } catch (error) {
        console.error('배치 푸시 발송 실패:', error);
        totalFailedCount += batch.length;
      }
    }

    return {
      success: totalSentCount > 0,
      sentCount: totalSentCount,
      failedCount: totalFailedCount,
      totalTokens: tokens.length,
    };
  },
};
