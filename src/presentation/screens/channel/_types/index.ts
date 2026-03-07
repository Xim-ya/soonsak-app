import { ContentType } from '@/core/types/content/contentType.enum';
import type { SortType, SortOption } from '@/core/types/sort';

/**
 * 채널 페이지 정렬 타입 (공통 SortType의 별칭)
 * - all: 전체 (랜덤 정렬)
 * - latest: 업로드일순 (유튜브 영상 업로드일 기준)
 * - popular: 인기순
 */
type ChannelSortType = SortType;

/**
 * 채널 전용 정렬 옵션 목록
 * - 탐색(Explore) 페이지와 달리 '최신순' 대신 '업로드일순' 라벨 사용
 * - 채널 관련 화면에서는 유튜브 영상의 uploaded_at 기준 정렬
 */
const CHANNEL_SORT_OPTIONS: SortOption<ChannelSortType>[] = [
  { value: 'all', label: '전체' },
  { value: 'latest', label: '업로드일순' },
  { value: 'popular', label: '인기순' },
];

/**
 * 채널 선택 아이템 모델
 */
interface ChannelItemModel {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly subscriberCount?: number | undefined;
}

/**
 * 채널 비디오 카드에 표시할 데이터 모델
 */
interface ChannelVideoModel {
  readonly videoId: string;
  readonly contentId: number;
  readonly contentType: ContentType;
  readonly videoTitle: string;
  readonly contentTitle: string;
  /** 콘텐츠 backdrop 이미지 경로 (TMDB) */
  readonly backdropPath?: string | undefined;
  readonly channelId: string;
  readonly channelName: string;
  readonly channelLogoUrl: string;
  readonly releaseYear?: string | undefined;
  readonly genreText?: string | undefined;
  /** 비디오 런타임 (초 단위) */
  readonly runtime?: number | undefined;
}

/**
 * 채널 비디오 조회 응답
 */
interface ChannelVideosResponse {
  videos: ChannelVideoModel[];
  hasMore: boolean;
  totalCount: number;
}

export { CHANNEL_SORT_OPTIONS };
export type { ChannelSortType, ChannelItemModel, ChannelVideoModel, ChannelVideosResponse };
