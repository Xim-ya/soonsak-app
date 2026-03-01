/**
 * useYouTubeComments - YouTube 댓글 조회 훅
 *
 * 2단계 최적화 흐름 지원:
 * 1. usePrefetchCommentToken: 페이지 진입 시 token만 미리 조회
 * 2. useYouTubeComments: 댓글 탭 진입 시 token으로 댓글 조회
 *
 * @example
 * // ContentDetailProvider에서 prefetch
 * const { token, totalCountText } = usePrefetchCommentToken(videoId);
 *
 * // CommentsView에서 댓글 조회
 * const { data } = useYouTubeComments(videoId, { token, totalCountText });
 */

import { useQuery } from '@tanstack/react-query';
import { commentApi, CommentTokenResponseDto } from '../api/commentApi';
import { CommentsResponseDto } from '../types';
import { youtubeKeys } from './youtubeQueryKeys';

/** 캐시 유지 시간 (10분) */
const STALE_TIME_MS = 1000 * 60 * 10;

/* ========================================
 * 1단계: Token Prefetch 훅
 * ======================================== */

interface UsePrefetchCommentTokenResult {
  /** Continuation token */
  token: string | null;
  /** 총 댓글 수 텍스트 */
  totalCountText: string | undefined;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
}

/**
 * 댓글 토큰 Prefetch 훅
 *
 * 페이지 진입 시 호출하여 continuation token을 미리 조회합니다.
 * 댓글 탭 진입 시 이 token을 사용하면 더 빠르게 댓글을 로드할 수 있습니다.
 *
 * @param videoId YouTube 비디오 ID
 * @returns token, totalCountText, isLoading, error
 */
export function usePrefetchCommentToken(
  videoId: string | undefined,
): UsePrefetchCommentTokenResult {
  const { data, isLoading, error } = useQuery({
    queryKey: youtubeKeys.commentToken(videoId ?? ''),
    queryFn: async (): Promise<CommentTokenResponseDto> => {
      if (!videoId) {
        throw new Error('비디오 ID가 없습니다');
      }
      return commentApi.prefetchToken(videoId);
    },
    enabled: !!videoId,
    staleTime: STALE_TIME_MS,
    retry: 1,
  });

  return {
    token: data?.token ?? null,
    totalCountText: data?.totalCountText,
    isLoading,
    error: error as Error | null,
  };
}

/* ========================================
 * 2단계: 댓글 조회 훅
 * ======================================== */

interface UseYouTubeCommentsOptions {
  /** 정렬 기준 ('TOP' | 'NEWEST') */
  sortBy?: 'TOP' | 'NEWEST';
  /** 쿼리 활성화 여부 */
  enabled?: boolean;
  /** Prefetch된 token (있으면 2단계 최적화 사용) */
  token?: string | null;
  /** Prefetch된 총 댓글 수 텍스트 */
  totalCountText?: string | undefined;
  /** Token prefetch 진행 중 여부 */
  isTokenLoading?: boolean;
}

interface UseYouTubeCommentsResult {
  /** 댓글 데이터 */
  data: CommentsResponseDto | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
  /** 데이터 새로고침 */
  refetch: () => void;
}

/**
 * YouTube 댓글 조회 훅
 *
 * 2단계 최적화 흐름:
 * - token prefetch 진행 중: 대기 (이중 호출 방지)
 * - token 있음: token으로 댓글 조회 (빠름)
 * - token 없음 (prefetch 실패): 기존 전체 흐름 사용
 *
 * @param videoId YouTube 비디오 ID
 * @param options 옵션 (정렬 기준, 활성화 여부, prefetch된 token)
 * @returns 댓글 데이터, 로딩 상태, 에러
 */
export function useYouTubeComments(
  videoId: string | undefined,
  options: UseYouTubeCommentsOptions = {},
): UseYouTubeCommentsResult {
  const { sortBy = 'TOP', enabled = true, token, totalCountText, isTokenLoading = false } = options;

  // token prefetch 완료 여부 확인
  // - token이 있으면: token으로 조회
  // - token이 없고 로딩 중이 아니면: 전체 흐름으로 폴백
  // - 로딩 중이면: 대기 (쿼리 비활성화)
  const shouldUseToken = !!token;
  const shouldFallback = !token && !isTokenLoading;
  const queryEnabled = enabled && !!videoId && (shouldUseToken || shouldFallback);

  const { data, isLoading, error, refetch } = useQuery({
    // queryKey에서 token 제외 → 캐시 공유로 이중 호출 방지
    queryKey: youtubeKeys.commentList(videoId ?? '', sortBy),
    queryFn: async (): Promise<CommentsResponseDto> => {
      // token이 있으면 2단계 최적화 사용
      if (token) {
        return commentApi.getCommentsWithToken(token, totalCountText);
      }

      // token이 없으면 기존 전체 흐름 사용
      if (!videoId) {
        throw new Error('비디오 ID가 없습니다');
      }
      return commentApi.getComments(videoId, sortBy);
    },
    enabled: queryEnabled,
    staleTime: STALE_TIME_MS,
    retry: 1,
  });

  return {
    data: data ?? null,
    // token 로딩 중이면 로딩 상태로 표시
    isLoading: isLoading || isTokenLoading,
    error: error as Error | null,
    refetch,
  };
}
