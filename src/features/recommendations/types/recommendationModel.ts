import type { ContentType } from '@/core/types/content/contentType.enum';
import type { GenrePreferenceDto, RecommendedContentDto } from './index';

/**
 * 장르 선호도 모델
 * UI에서 사용하기 편한 형태로 변환된 모델
 */
export class GenrePreferenceModel {
  constructor(
    public readonly genreId: number,
    public readonly preferenceScore: number,
    public readonly watchCount: number,
    public readonly completedCount: number,
    public readonly avgRating: number,
    public readonly favoriteCount: number,
  ) {}

  static fromDto(dto: GenrePreferenceDto): GenrePreferenceModel {
    return new GenrePreferenceModel(
      dto.genreId,
      dto.preferenceScore,
      dto.watchCount,
      dto.completedCount,
      dto.avgRating,
      dto.favoriteCount,
    );
  }

  static fromDtoList(dtos: GenrePreferenceDto[]): GenrePreferenceModel[] {
    return dtos.map(GenrePreferenceModel.fromDto);
  }
}

/**
 * 추천 콘텐츠 모델
 * UI에서 사용하기 편한 형태로 변환된 모델
 */
export class RecommendedContentModel {
  constructor(
    public readonly id: number,
    public readonly contentType: ContentType,
    public readonly title: string,
    public readonly posterPath: string,
    public readonly backdropPath: string,
    public readonly releaseDate: string,
    public readonly voteAverage: number,
    public readonly popularity: number,
    public readonly genreIds: number[],
    public readonly uploadedAt: string,
    public readonly viewCount: number,
    public readonly playCount: number,
    public readonly recommendationScore: number,
    public readonly genreMatchScore: number,
    public readonly channelMatchScore: number,
  ) {}

  static fromDto(dto: RecommendedContentDto): RecommendedContentModel {
    return new RecommendedContentModel(
      dto.id,
      dto.contentType,
      dto.title,
      dto.posterPath ?? '',
      dto.backdropPath ?? '',
      dto.releaseDate ?? '',
      dto.voteAverage ?? 0,
      dto.popularity ?? 0,
      dto.genreIds ?? [],
      dto.uploadedAt ?? '',
      dto.viewCount ?? 0,
      dto.playCount ?? 0,
      dto.recommendationScore,
      dto.genreMatchScore,
      dto.channelMatchScore,
    );
  }

  static fromDtoList(dtos: RecommendedContentDto[]): RecommendedContentModel[] {
    return dtos.map(RecommendedContentModel.fromDto);
  }

  /**
   * 개인화 추천 점수 레이블 반환
   * (디버그/개발용)
   */
  get scoreLabel(): string {
    return `추천: ${this.recommendationScore.toFixed(1)} (장르: ${this.genreMatchScore.toFixed(1)}, 채널: ${this.channelMatchScore.toFixed(1)})`;
  }
}
