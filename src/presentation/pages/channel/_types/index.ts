import { ContentType } from '@/presentation/types/content/contentType.enum';

/**
 * 채널 페이지 정렬 타입
 * - all: 전체 (랜덤 정렬)
 * - latest: 최신순
 * - popular: 인기순
 */
type ChannelSortType = 'all' | 'latest' | 'popular';

/**
 * 채널 선택 아이템 모델
 */
interface ChannelItemModel {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;
  readonly subscriberCount?: number;
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
  readonly backdropPath?: string;
  readonly channelId: string;
  readonly channelName: string;
  readonly channelLogoUrl: string;
  readonly releaseYear?: string;
  readonly genreText?: string;
  /** 비디오 런타임 (초 단위) */
  readonly runtime?: number;
}

/**
 * 채널 비디오 조회 응답
 */
interface ChannelVideosResponse {
  videos: ChannelVideoModel[];
  hasMore: boolean;
  totalCount: number;
}

export type { ChannelSortType, ChannelItemModel, ChannelVideoModel, ChannelVideosResponse };
