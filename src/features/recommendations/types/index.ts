import type { ContentType } from '@/shared/types/content/contentType.enum';

/**
 * ISO 8601 형식의 타임스탬프 문자열 타입
 */
type ISOTimestamp = string;

/**
 * 장르 선호도 DTO
 * get_user_genre_preferences RPC 응답과 1대1 대응
 */
interface GenrePreferenceDto {
  readonly genreId: number;
  readonly preferenceScore: number;
  readonly watchCount: number;
  readonly completedCount: number;
  readonly avgRating: number;
  readonly favoriteCount: number;
}

/**
 * 추천 콘텐츠 DTO
 * get_personalized_recommendations RPC 응답과 1대1 대응
 */
interface RecommendedContentDto {
  readonly id: number;
  readonly contentType: ContentType;
  readonly title: string;
  readonly posterPath: string;
  readonly backdropPath: string;
  readonly releaseDate: string;
  readonly voteAverage: number;
  readonly popularity: number;
  readonly genreIds: number[];
  readonly uploadedAt: ISOTimestamp;
  readonly viewCount: number;
  readonly playCount: number;
  readonly recommendationScore: number;
  readonly genreMatchScore: number;
  readonly channelMatchScore: number;
}

/**
 * 개인화 추천 응답 DTO
 */
interface PersonalizedRecommendationsResponse {
  readonly contents: RecommendedContentDto[];
  readonly hasMore: boolean;
  readonly totalCount: number;
}

export type {
  ISOTimestamp,
  GenrePreferenceDto,
  RecommendedContentDto,
  PersonalizedRecommendationsResponse,
};
