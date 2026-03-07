/**
 * Admin Channel API
 *
 * 어드민 전용 채널 관리 API
 */

import { supabaseClient } from '@/core/api';
import { CONTENT_DATABASE, CHANNEL_DATABASE } from '@/core/config';
import { ChannelLogger } from '@/core/utils';

// ============================================================================
// Types
// ============================================================================

/** 채널 관리 목록 아이템 */
export interface ChannelManagementItem {
  id: string;
  name: string;
  logoUrl: string | null;
  subscriberCount: number | null;
  videoCount: number;
  contentCount: number;
  createdAt: string;
}

/** 채널 상세 아이템 */
export interface ChannelDetailItem {
  id: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  subscriberCount: number | null;
  videoCount: number;
  contentCount: number;
  createdAt: string;
}

/** 채널의 콘텐츠 아이템 (3열 그리드용) */
export interface ChannelContentItem {
  contentId: number;
  contentType: 'movie' | 'tv';
  contentTitle: string;
  posterPath: string | null;
  videoCount: number;
}

/** 채널 목록 조회 결과 */
export interface ChannelListResult {
  channels: ChannelManagementItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** 채널 콘텐츠 목록 조회 결과 */
export interface ChannelContentsResult {
  contents: ChannelContentItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** 채널 삭제 결과 */
export interface DeleteChannelResult {
  deletedVideosCount: number;
  deletedContentsCount: number;
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
 * limit 값 정규화 (범위 내로 제한)
 */
function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < MIN_PAGE_LIMIT) {
    return DEFAULT_PAGE_LIMIT;
  }
  return Math.min(limit, MAX_PAGE_LIMIT);
}

// ============================================================================
// API
// ============================================================================

export const adminChannelApi = {
  /**
   * 채널 목록 조회 (무한스크롤)
   *
   * @param cursor 페이지네이션 커서 (created_at 기준)
   * @param limit 한 번에 가져올 개수
   */
  getChannels: async (
    cursor: string | null,
    limit: number = DEFAULT_PAGE_LIMIT,
  ): Promise<ChannelListResult> => {
    const normalizedLimit = normalizeLimit(limit);

    // 기본 채널 정보 조회
    let query = supabaseClient
      .from(CHANNEL_DATABASE.TABLES.CHANNELS)
      .select('id, name, logo_url, subscriber_count, created_at')
      .order('created_at', { ascending: false })
      .limit(normalizedLimit + 1);

    // 커서 기반 페이지네이션
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: channels, error: channelsError } = await query;

    if (channelsError) {
      ChannelLogger.error('채널 목록 조회 실패:', channelsError);
      throw new Error(`Failed to fetch channels: ${channelsError.message}`);
    }

    const hasMore = (channels?.length ?? 0) > normalizedLimit;
    const channelList = (channels ?? []).slice(0, normalizedLimit);

    // 각 채널의 비디오 수 및 콘텐츠 수 조회 (병렬 처리)
    const channelsWithCounts = await Promise.all(
      channelList.map(async (channel) => {
        // 비디오 수 조회
        const { count: videoCount, error: videoCountError } = await supabaseClient
          .from(CONTENT_DATABASE.TABLES.VIDEOS)
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channel.id);

        if (videoCountError) {
          ChannelLogger.warn(`채널 ${channel.id}의 비디오 수 조회 실패:`, videoCountError);
        }

        // 고유 콘텐츠 수 조회 (content_id, content_type 조합으로 카운트)
        const { data: contentData, error: contentCountError } = await supabaseClient
          .from(CONTENT_DATABASE.TABLES.VIDEOS)
          .select('content_id, content_type')
          .eq('channel_id', channel.id);

        if (contentCountError) {
          ChannelLogger.warn(`채널 ${channel.id}의 콘텐츠 수 조회 실패:`, contentCountError);
        }

        // 고유 콘텐츠 수 계산 (content_id + content_type 조합)
        const uniqueContents = new Set(
          (contentData ?? []).map((v) => `${v.content_id}_${v.content_type}`),
        );

        return {
          id: channel.id,
          name: channel.name,
          logoUrl: channel.logo_url,
          subscriberCount: channel.subscriber_count,
          videoCount: videoCount ?? 0,
          contentCount: uniqueContents.size,
          createdAt: channel.created_at,
        };
      }),
    );

    return {
      channels: channelsWithCounts,
      hasMore,
      nextCursor:
        hasMore && channelList.length > 0 ? channelList[channelList.length - 1]!.created_at : null,
    };
  },

  /**
   * 채널 상세 조회
   *
   * @param channelId 채널 ID
   */
  getChannelDetail: async (channelId: string): Promise<ChannelDetailItem> => {
    if (!channelId || typeof channelId !== 'string') {
      throw new Error('Invalid channel ID');
    }

    // 채널 기본 정보 조회
    const { data: channel, error: channelError } = await supabaseClient
      .from(CHANNEL_DATABASE.TABLES.CHANNELS)
      .select('id, name, logo_url, banner_url, subscriber_count, created_at')
      .eq('id', channelId)
      .single();

    if (channelError) {
      ChannelLogger.error('채널 상세 조회 실패:', channelError);
      throw new Error(`Failed to fetch channel detail: ${channelError.message}`);
    }

    // 비디오 수 조회
    const { count: videoCount, error: videoCountError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId);

    if (videoCountError) {
      ChannelLogger.warn('채널 비디오 수 조회 실패:', videoCountError);
    }

    // 고유 콘텐츠 수 조회
    const { data: contentData, error: contentCountError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select('content_id, content_type')
      .eq('channel_id', channelId);

    if (contentCountError) {
      ChannelLogger.warn('채널 콘텐츠 수 조회 실패:', contentCountError);
    }

    const uniqueContents = new Set(
      (contentData ?? []).map((v) => `${v.content_id}_${v.content_type}`),
    );

    return {
      id: channel.id,
      name: channel.name,
      logoUrl: channel.logo_url,
      bannerUrl: channel.banner_url,
      subscriberCount: channel.subscriber_count,
      videoCount: videoCount ?? 0,
      contentCount: uniqueContents.size,
      createdAt: channel.created_at,
    };
  },

  /**
   * 채널의 콘텐츠 목록 조회 (3열 그리드용)
   *
   * @param channelId 채널 ID
   * @param cursor 페이지네이션 커서
   * @param limit 한 번에 가져올 개수
   */
  getChannelContents: async (
    channelId: string,
    cursor: string | null,
    limit: number = 30,
  ): Promise<ChannelContentsResult> => {
    if (!channelId || typeof channelId !== 'string') {
      throw new Error('Invalid channel ID');
    }

    const normalizedLimit = normalizeLimit(limit);

    // 해당 채널의 모든 비디오를 콘텐츠별로 그룹화
    const { data: videos, error: videosError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select(
        `
        content_id,
        content_type,
        uploaded_at,
        contents (
          title,
          poster_path
        )
      `,
      )
      .eq('channel_id', channelId)
      .order('uploaded_at', { ascending: false });

    if (videosError) {
      ChannelLogger.error('채널 비디오 목록 조회 실패:', videosError);
      throw new Error(`Failed to fetch channel videos: ${videosError.message}`);
    }

    // 콘텐츠별로 그룹화하여 비디오 수 계산
    const contentMap = new Map<
      string,
      {
        contentId: number;
        contentType: 'movie' | 'tv';
        contentTitle: string;
        posterPath: string | null;
        videoCount: number;
        latestUploadedAt: string;
      }
    >();

    for (const video of videos ?? []) {
      const key = `${video.content_id}_${video.content_type}`;
      const content = video.contents as unknown as { title: string; poster_path: string | null };

      if (contentMap.has(key)) {
        const existing = contentMap.get(key)!;
        existing.videoCount += 1;
        // 최신 날짜 유지
        if (video.uploaded_at > existing.latestUploadedAt) {
          existing.latestUploadedAt = video.uploaded_at;
        }
      } else {
        contentMap.set(key, {
          contentId: video.content_id,
          contentType: video.content_type as 'movie' | 'tv',
          contentTitle: content?.title ?? '알 수 없음',
          posterPath: content?.poster_path ?? null,
          videoCount: 1,
          latestUploadedAt: video.uploaded_at,
        });
      }
    }

    // 최신순 정렬
    const sortedContents = Array.from(contentMap.values()).sort((a, b) =>
      b.latestUploadedAt.localeCompare(a.latestUploadedAt),
    );

    // 커서 기반 페이지네이션 적용
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = sortedContents.findIndex((c) => c.latestUploadedAt < cursor);
      startIndex = cursorIndex >= 0 ? cursorIndex : sortedContents.length;
    }

    const paginatedContents = sortedContents.slice(startIndex, startIndex + normalizedLimit + 1);
    const hasMore = paginatedContents.length > normalizedLimit;
    const resultContents = paginatedContents.slice(0, normalizedLimit);

    return {
      contents: resultContents.map((c) => ({
        contentId: c.contentId,
        contentType: c.contentType,
        contentTitle: c.contentTitle,
        posterPath: c.posterPath,
        videoCount: c.videoCount,
      })),
      hasMore,
      nextCursor:
        hasMore && resultContents.length > 0
          ? resultContents[resultContents.length - 1]!.latestUploadedAt
          : null,
    };
  },

  /**
   * 채널 삭제 (cascade 로직)
   *
   * 삭제 순서:
   * 1. 채널의 모든 비디오 ID 조회
   * 2. 각 비디오가 속한 콘텐츠 확인 - 해당 콘텐츠의 유일한 비디오면 콘텐츠도 삭제 대상
   * 3. 비디오 삭제
   * 4. 콘텐츠 삭제
   * 5. 채널 삭제
   *
   * @param channelId 채널 ID
   */
  deleteChannel: async (channelId: string): Promise<DeleteChannelResult> => {
    if (!channelId || typeof channelId !== 'string') {
      throw new Error('Invalid channel ID');
    }

    // 1. 채널의 모든 비디오 조회
    const { data: videos, error: videosError } = await supabaseClient
      .from(CONTENT_DATABASE.TABLES.VIDEOS)
      .select('id, content_id, content_type')
      .eq('channel_id', channelId);

    if (videosError) {
      ChannelLogger.error('채널 비디오 조회 실패:', videosError);
      throw new Error(`Failed to fetch channel videos: ${videosError.message}`);
    }

    const videoIds = (videos ?? []).map((v) => v.id);
    const deletedVideosCount = videoIds.length;

    // 2. 각 콘텐츠별 비디오 수 확인하여 삭제 대상 콘텐츠 식별
    const contentVideoCountMap = new Map<string, number>();
    const contentsToDelete: Array<{ contentId: number; contentType: string }> = [];

    // 고유 콘텐츠 목록 추출
    const uniqueContents = new Map<string, { contentId: number; contentType: string }>();
    for (const video of videos ?? []) {
      const key = `${video.content_id}_${video.content_type}`;
      if (!uniqueContents.has(key)) {
        uniqueContents.set(key, {
          contentId: video.content_id,
          contentType: video.content_type,
        });
      }
    }

    // 각 콘텐츠의 전체 비디오 수 확인
    for (const [key, content] of uniqueContents) {
      const { count, error: countError } = await supabaseClient
        .from(CONTENT_DATABASE.TABLES.VIDEOS)
        .select('*', { count: 'exact', head: true })
        .eq('content_id', content.contentId)
        .eq('content_type', content.contentType);

      if (countError) {
        ChannelLogger.warn(`콘텐츠 ${key}의 비디오 수 조회 실패:`, countError);
        continue;
      }

      contentVideoCountMap.set(key, count ?? 0);

      // 이 채널의 비디오 수 계산
      const channelVideoCount = (videos ?? []).filter(
        (v) => v.content_id === content.contentId && v.content_type === content.contentType,
      ).length;

      // 해당 콘텐츠의 모든 비디오가 이 채널에만 있으면 콘텐츠도 삭제
      if (count === channelVideoCount) {
        contentsToDelete.push(content);
      }
    }

    // 3. 비디오 삭제
    if (videoIds.length > 0) {
      const { error: deleteVideosError } = await supabaseClient
        .from(CONTENT_DATABASE.TABLES.VIDEOS)
        .delete()
        .in('id', videoIds);

      if (deleteVideosError) {
        ChannelLogger.error('비디오 삭제 실패:', deleteVideosError);
        throw new Error(`Failed to delete videos: ${deleteVideosError.message}`);
      }
    }

    // 4. 콘텐츠 삭제
    let deletedContentsCount = 0;
    for (const content of contentsToDelete) {
      const { error: deleteContentError } = await supabaseClient
        .from(CONTENT_DATABASE.TABLES.CONTENTS)
        .delete()
        .eq('id', content.contentId)
        .eq('content_type', content.contentType);

      if (deleteContentError) {
        ChannelLogger.warn(`콘텐츠 ${content.contentId} 삭제 실패:`, deleteContentError);
      } else {
        deletedContentsCount += 1;
      }
    }

    // 5. 채널 삭제
    const { error: deleteChannelError } = await supabaseClient
      .from(CHANNEL_DATABASE.TABLES.CHANNELS)
      .delete()
      .eq('id', channelId);

    if (deleteChannelError) {
      ChannelLogger.error('채널 삭제 실패:', deleteChannelError);
      throw new Error(`Failed to delete channel: ${deleteChannelError.message}`);
    }

    return {
      deletedVideosCount,
      deletedContentsCount,
    };
  },
};
