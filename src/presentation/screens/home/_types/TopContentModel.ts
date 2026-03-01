import { ContentType } from '@/shared/types/content/contentType.enum';
import { BaseContentModel } from '@/shared/types/content/baseContentModel';
import { ContentDto } from '@/features/content/types';
import { TMDB_GENRE_MAP } from '@/features/content/constants/genreConstants';

interface TopContentModel extends BaseContentModel {
  /** 포인트 설명 (tagline) */
  pointDescription: string;
  /** 장르 키워드 배열 (최대 3개) */
  keywords: string[];
  /** 배경 이미지 URL (TMDB 파일명) */
  backdropImgUrl: string;
  /** 한국어 타이틀 로고 URL (TMDB 파일명). 로고가 없거나 한국어가 아니면 null */
  logoUrl: string | null;
}

/** 최대 키워드 표시 개수 */
const MAX_KEYWORDS = 3;

/** 유효한 콘텐츠 타입 목록 */
const VALID_CONTENT_TYPES: ContentType[] = ['movie', 'tv', 'unknown'];

/**
 * genre_ids 배열을 한글 장르명 배열로 변환
 * @param genreIds TMDB 장르 ID 배열
 * @returns 한글 장르명 배열 (최대 3개)
 */
function convertGenreIdsToKeywords(genreIds: number[] | null | undefined): string[] {
  if (!genreIds || !Array.isArray(genreIds) || genreIds.length === 0) {
    return [];
  }

  return genreIds
    .slice(0, MAX_KEYWORDS)
    .map((id) => TMDB_GENRE_MAP[id])
    .filter((name): name is string => name !== undefined);
}

/**
 * contentType 문자열을 안전하게 ContentType으로 변환
 * 유효하지 않은 값은 'unknown'으로 처리
 */
function safeContentType(contentType: string | undefined | null): ContentType {
  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
    return 'unknown';
  }
  return contentType as ContentType;
}

/**
 * 한국어 로고 URL 추출
 * 로고가 있고 언어가 'ko'인 경우에만 URL 반환, 그 외 null
 */
function extractKoreanLogoUrl(dto: ContentDto): string | null {
  if (dto.titleLogo && dto.titleLogoLang === 'ko') {
    return dto.titleLogo;
  }
  return null;
}

/**
 * ContentDto를 TopContentModel로 변환
 * 필수 필드 누락 시에도 기본값으로 안전하게 변환
 */
function fromContentDto(dto: ContentDto): TopContentModel {
  return {
    id: dto.id ?? 0,
    title: dto.title ?? '',
    type: safeContentType(dto.contentType),
    posterPath: dto.posterPath,
    backdropPath: dto.backdropPath,
    pointDescription: dto.tagline ?? '',
    keywords: convertGenreIdsToKeywords(dto.genreIds),
    backdropImgUrl: dto.backdropPath ?? '',
    logoUrl: extractKoreanLogoUrl(dto),
  };
}

/**
 * TopContentModel의 필수 필드 유효성 검사
 * 배너 표시에 필요한 id, title, backdropImgUrl이 모두 있어야 유효
 */
function isValidTopContent(model: TopContentModel): boolean {
  return (
    typeof model.id === 'number' &&
    model.id > 0 &&
    typeof model.title === 'string' &&
    model.title.length > 0 &&
    typeof model.backdropImgUrl === 'string' &&
    model.backdropImgUrl.length > 0
  );
}

export { TopContentModel, fromContentDto, isValidTopContent };
