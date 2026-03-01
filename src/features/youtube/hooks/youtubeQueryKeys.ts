/**
 * YouTube Query Key Factory
 *
 * YouTube 관련 React Query 캐시 키를 중앙 관리합니다.
 * 계층적 구조로 일괄 무효화와 개별 쿼리 관리가 용이합니다.
 *
 * @example
 * // 개별 쿼리
 * queryKey: youtubeKeys.video('dQw4w9WgXcQ')
 *
 * // YouTube 전체 캐시 무효화
 * queryClient.invalidateQueries({ queryKey: youtubeKeys.all })
 */

export const youtubeKeys = {
  /** YouTube 루트 키 */
  all: ['youtube'] as const,

  /** 비디오 전체 메타데이터 */
  video: (urlOrId: string) => [...youtubeKeys.all, 'video', urlOrId] as const,

  /** 빠른 비디오 정보 (oEmbed) */
  quick: (urlOrId: string) => [...youtubeKeys.all, 'quick', urlOrId] as const,

  /** 다중 비디오 조회 */
  multiple: (urls: string[]) => [...youtubeKeys.all, 'multiple', [...urls].sort()] as const,

  /** 채널 정보 */
  channel: (channelId: string) => [...youtubeKeys.all, 'channel', channelId] as const,

  /** 비디오 댓글 */
  comments: (videoId: string) => [...youtubeKeys.all, 'comments', videoId] as const,

  /** 비디오 메트릭 (조회수, 좋아요 등) */
  metrics: (videoId: string) => [...youtubeKeys.all, 'metrics', videoId] as const,

  /** 댓글 토큰 (prefetch용) */
  commentToken: (videoId: string) => [...youtubeKeys.all, 'commentToken', videoId] as const,

  /** 댓글 목록 */
  commentList: (videoId: string, sortBy: 'TOP' | 'NEWEST') =>
    [...youtubeKeys.all, 'comments', videoId, sortBy] as const,
};
