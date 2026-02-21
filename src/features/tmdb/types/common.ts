/**
 * TMDB API 타입 정의
 * interceptor에서 snake_case를 camelCase로 자동 변환하므로
 * 인터페이스는 camelCase로 정의
 */

/**
 * TMDB API 에러 클래스
 */
export class TmdbApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retry: boolean = true,
  ) {
    super(message);
    this.name = 'TmdbApiError';
  }
}

/**
 * 장르 정보 DTO
 */
export interface GenreDto {
  readonly id: number;
  readonly name: string;
}

/**
 * 제작사 정보 DTO
 */
export interface ProductionCompanyDto {
  readonly id: number;
  readonly logoPath: string | null;
  readonly name: string;
  readonly originCountry: string;
}

/**
 * 제작 국가 정보 DTO
 */
export interface ProductionCountryDto {
  readonly iso31661: string;
  readonly name: string;
}

/**
 * 사용 언어 정보 DTO
 */
export interface SpokenLanguageDto {
  readonly englishName: string;
  readonly iso6391: string;
  readonly name: string;
}

/**
 * TMDB API 에러 응답 DTO
 */
export interface TmdbErrorDto {
  readonly success: boolean;
  readonly statusCode: number;
  readonly statusMessage: string;
}

/**
 * TMDB API 공통 응답 타입
 */
export type TmdbApiResponse<T> = T | TmdbErrorDto;

/**
 * TMDB 관련 콘텐츠 아이템 DTO (영화용)
 * recommendations, similar API에서 반환되는 아이템
 */
export interface RelatedMovieItemDto {
  readonly id: number;
  readonly title: string;
  readonly originalTitle: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly releaseDate: string;
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly popularity: number;
  readonly adult: boolean;
  readonly genreIds: number[];
  readonly originalLanguage: string;
  readonly video: boolean;
}

/**
 * TMDB 관련 콘텐츠 아이템 DTO (TV용)
 * recommendations, similar API에서 반환되는 아이템
 */
export interface RelatedTvItemDto {
  readonly id: number;
  readonly name: string;
  readonly originalName: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly firstAirDate: string;
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly popularity: number;
  readonly adult: boolean;
  readonly genreIds: number[];
  readonly originalLanguage: string;
  readonly originCountry: string[];
}

/**
 * TMDB 페이지네이션 응답 DTO
 */
export interface TmdbPaginatedResponse<T> {
  readonly page: number;
  readonly results: T[];
  readonly totalPages: number;
  readonly totalResults: number;
}

/**
 * TMDB Trending API 응답 아이템 DTO
 * /trending/all/week 또는 /trending/all/day에서 반환되는 아이템
 * movie와 tv 타입 모두 포함할 수 있음
 */
export interface TrendingItemDto {
  readonly id: number;
  readonly mediaType: 'movie' | 'tv';
  readonly title?: string; // movie의 경우
  readonly name?: string; // tv의 경우
  readonly originalTitle?: string;
  readonly originalName?: string;
  readonly overview: string;
  readonly posterPath: string | null;
  readonly backdropPath: string | null;
  readonly releaseDate?: string; // movie의 경우
  readonly firstAirDate?: string; // tv의 경우
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly popularity: number;
  readonly adult: boolean;
  readonly genreIds: number[];
  readonly originalLanguage: string;
}

/**
 * TMDB Multi Search API 응답 아이템 DTO
 * /search/multi에서 반환되는 아이템
 * movie, tv, person 타입 포함 (person은 필터링하여 사용)
 */
export interface SearchMultiItemDto {
  readonly id: number;
  readonly mediaType: 'movie' | 'tv' | 'person';
  readonly title?: string; // movie의 경우
  readonly name?: string; // tv/person의 경우
  readonly originalTitle?: string;
  readonly originalName?: string;
  readonly overview?: string;
  readonly posterPath: string | null;
  readonly backdropPath?: string | null;
  readonly releaseDate?: string; // movie의 경우
  readonly firstAirDate?: string; // tv의 경우
  readonly voteAverage?: number;
  readonly popularity: number;
  readonly adult?: boolean;
  readonly genreIds?: number[];
  readonly originalLanguage?: string;
  readonly originCountry?: string[];
}
