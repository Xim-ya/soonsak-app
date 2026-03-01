import { TVCreditsResponse, MovieCreditsResponse } from '@/features/tmdb/types/creditDto';
import { ContentType } from '@/presentation/types/content/contentType.enum';

/**
 * CreditPersonModel - 크레딧 인물 정보
 *
 * 요청하신 공통 필드만 포함: id, knownForDepartment, name, character, profilePath
 */
export interface CreditPersonModel {
  readonly id: number;
  readonly knownForDepartment: string;
  readonly name: string;
  readonly character: string | null;
  readonly profilePath: string | null;
}

export namespace CreditPersonModel {
  /**
   * TV/Movie Credits 응답에서 CreditPersonModel[] 변환
   */
  export function fromDto(
    response: TVCreditsResponse | MovieCreditsResponse,
    contentType: ContentType,
  ): CreditPersonModel[] {
    if (contentType === 'movie') {
      const movieResponse = response as MovieCreditsResponse;
      return movieResponse.cast.map((cast) => ({
        id: cast.id,
        knownForDepartment: cast.knownForDepartment,
        name: cast.name,
        character: cast.character,
        profilePath: cast.profilePath,
      }));
    } else if (contentType === 'tv') {
      const tvResponse = response as TVCreditsResponse;
      return tvResponse.cast.map((cast) => ({
        id: cast.id,
        knownForDepartment: cast.knownForDepartment,
        name: cast.name,
        character: cast.character,
        profilePath: cast.profilePath,
      }));
    } else {
      throw new Error(`지원하지 않는 콘텐츠 타입: ${contentType}`);
    }
  }
}
