/**
 * TMDB Credits API 응답 타입 정의
 * TV Credits, Movie Credits에서 공통으로 사용되는 타입들
 */

// 기본 인물 정보
interface BasePerson {
  adult: boolean;
  gender: number;
  id: number;
  knownForDepartment: string;
  name: string;
  originalName: string;
  popularity: number;
  profilePath: string | null;
}

// Cast 공통 필드
interface BaseCast extends BasePerson {
  character: string;
  creditId: string;
  order: number;
}

// TV Cast (cast_id 없음)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TVCast extends BaseCast {}

// Movie Cast (cast_id 있음)
export interface MovieCast extends BaseCast {
  castId: number;
}

// Crew (TV와 Movie 동일)
export interface Crew extends BasePerson {
  creditId: string;
  department: string;
  job: string;
}

// TV Credits 응답
export interface TVCreditsResponse {
  cast: TVCast[];
  crew: Crew[];
  id: number;
}

// Movie Credits 응답
export interface MovieCreditsResponse {
  id: number;
  cast: MovieCast[];
  crew: Crew[];
}
