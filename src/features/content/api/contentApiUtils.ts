import { supabaseClient } from '@/core/api';
import { ContentLogger } from '@/core/utils';
import { ContentType } from '@/core/types/content/contentType.enum';
import type { ContentDto } from '../types';

/** excludeIds 최대 허용 수 */
export const MAX_EXCLUDE_IDS = 1000;

/** 조회수/재생수 RPC 호출 쓰로틀 (콘텐츠별 최소 간격) */
export const RPC_THROTTLE_MS = 5000;
export const rpcThrottleMap = new Map<string, number>();

/** 트렌딩 RPC 결과 행 타입 (out_ 접두사 컬럼명) */
export type RpcTrendingRow = {
  out_id: number;
  out_content_type: string;
  out_title: string;
  out_poster_path: string | null;
  out_backdrop_path: string | null;
  out_title_logo: string | null;
  out_title_logo_lang: string | null;
  out_trending_score: number;
};

/** 유효한 ContentType 값인지 검증 */
export function isValidContentType(value: string): value is ContentType {
  return value === 'movie' || value === 'tv';
}

/** 유효한 title logo 언어 값인지 검증 */
export function isValidTitleLogoLang(value: string): value is 'ko' | 'en' {
  return value === 'ko' || value === 'en';
}

/** RPC 트렌딩 결과를 ContentDto 배열로 변환 */
export function mapTrendingRowsToContentDtos(rows: RpcTrendingRow[]): ContentDto[] {
  return rows
    .filter((row) => isValidContentType(row.out_content_type))
    .map((row): ContentDto => {
      const titleLogoLang =
        row.out_title_logo_lang && isValidTitleLogoLang(row.out_title_logo_lang)
          ? row.out_title_logo_lang
          : undefined;

      return {
        id: row.out_id,
        contentType: row.out_content_type as ContentType,
        title: row.out_title,
        ...(row.out_poster_path && { posterPath: row.out_poster_path }),
        ...(row.out_backdrop_path && { backdropPath: row.out_backdrop_path }),
        ...(row.out_title_logo && { titleLogo: row.out_title_logo }),
        ...(titleLogoLang && { titleLogoLang }),
      };
    });
}

/** 쓰로틀 체크: 최근 호출 이후 충분한 시간이 지났는지 확인 */
export function shouldThrottleRpc(key: string): boolean {
  const now = Date.now();
  const lastCall = rpcThrottleMap.get(key);
  if (lastCall !== undefined && now - lastCall < RPC_THROTTLE_MS) {
    return true;
  }
  rpcThrottleMap.set(key, now);
  return false;
}

/** excludeIds 유효성 검증 및 제한 */
export function sanitizeExcludeIds(excludeIds: number[]): number[] {
  return excludeIds.filter((id) => Number.isInteger(id) && id > 0).slice(0, MAX_EXCLUDE_IDS);
}

/**
 * 사용자의 시청 기록에서 콘텐츠 ID 목록을 조회
 * @returns 시청한 콘텐츠 ID 배열 또는 null (비로그인/조회실패/빈 결과)
 */
export async function getUserWatchedContentIds(): Promise<number[] | null> {
  const { data: userData } = await supabaseClient.auth.getUser();
  if (!userData?.user?.id) {
    return null;
  }

  const { data: watchedRows, error: watchedError } = await supabaseClient
    .from('watch_history')
    .select('content_id')
    .eq('user_id', userData.user.id);

  if (watchedError) {
    ContentLogger.error('시청 기록 콘텐츠 ID 조회 실패:', watchedError);
    return null;
  }

  if (!watchedRows || watchedRows.length === 0) {
    return null;
  }

  const rawIds = [...new Set(watchedRows.map((w: { content_id: number }) => w.content_id))];
  const sanitizedIds = sanitizeExcludeIds(rawIds);

  return sanitizedIds.length > 0 ? sanitizedIds : null;
}

/** Supabase 쿼리 필터 메서드 인터페이스 */
export interface FilterableQuery {
  in(column: string, values: readonly (number | string)[]): this;
  eq(column: string, value: unknown): this;
  overlaps(column: string, values: readonly (number | string)[]): this;
  gte(column: string, value: string | number): this;
  lte(column: string, value: string | number): this;
  not(column: string, operator: string, value: string): this;
}

/** 콘텐츠 필터 조건을 Supabase 쿼리에 적용 (count/data 쿼리 공용) */
export function applyContentFilters<T extends FilterableQuery>(
  query: T,
  filter: {
    contentType?: ContentType | null;
    genreIds: number[];
    countryCodes: string[];
    releaseYearRange?: { min: number; max: number } | null;
    minStarRating: number | null;
  },
  excludeIds: number[] | null,
  channelContentIds: number[] | null,
): T {
  let q = query;
  if (channelContentIds !== null) {
    q = q.in('id', channelContentIds);
  }
  if (filter.contentType) {
    q = q.eq('content_type', filter.contentType);
  }
  if (filter.genreIds.length > 0) {
    q = q.overlaps('genre_ids', filter.genreIds);
  }
  if (filter.countryCodes.length > 0) {
    q = q.overlaps('origin_country', filter.countryCodes);
  }
  if (filter.releaseYearRange) {
    q = q
      .gte('release_date', `${filter.releaseYearRange.min}-01-01`)
      .lte('release_date', `${filter.releaseYearRange.max}-12-31`);
  }
  if (filter.minStarRating !== null) {
    q = q.gte('vote_average', filter.minStarRating * 2);
  }
  if (excludeIds !== null && excludeIds.length > 0) {
    const safeIds = sanitizeExcludeIds(excludeIds);
    if (safeIds.length > 0) {
      q = q.not('id', 'in', `(${safeIds.join(',')})`);
    }
  }
  return q;
}
