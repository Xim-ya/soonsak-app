import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import { GenreDto, MovieDto, TvSeriesDto } from '@/features/tmdb';

/**
 * 콘텐츠 상세 페이지 데이터 모델
 * @extends BaseContentModel
 * - id: 콘텐츠 고유 ID
 * - title: 콘텐츠 제목
 * - type: 콘텐츠 타입 (영화, 드라마 등)
 * - posterPath: 포스터 이미지 경로
 */

export interface ContentDetailModel extends BaseContentModel {
  /** 배경 이미지 경로 */
  readonly backdropPath: string;
  /** 출시일 */
  readonly releaseDate: string;
  /** 장르 목록 */
  readonly genres: GenreDto[];
  /** 줄거리 */
  readonly overview: string;
  /** 평점 */
  readonly voteAverage: number;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ContentDetailModel {
  /**
   * TMDB API DTO를 ContentDetailModel로 변환
   * @param dto MovieDto 또는 TvSeriesDto
   * @param contentType 콘텐츠 타입 ('movie' | 'tv')
   * @returns ContentDetailModel
   */
  export function fromDto(
    dto: MovieDto | TvSeriesDto,
    contentType: ContentType,
  ): ContentDetailModel {
    // Movie와 TV 공통 필드
    const baseData = {
      id: dto.id,
      backdropPath: dto.backdropPath || '',
      genres: dto.genres,
      overview: dto.overview,
      voteAverage: dto.voteAverage,
      posterPath: dto.posterPath || '',
      type: contentType,
    };

    // Movie/TV별 특화 필드 처리
    if (contentType === 'movie') {
      const movieDto = dto as MovieDto;
      return {
        ...baseData,
        title: movieDto.title,
        releaseDate: movieDto.releaseDate,
      };
    } else {
      const tvDto = dto as TvSeriesDto;
      return {
        ...baseData,
        title: tvDto.name, // TV는 name 필드 사용
        releaseDate: tvDto.firstAirDate, // TV는 firstAirDate 사용
      };
    }
  }
}
