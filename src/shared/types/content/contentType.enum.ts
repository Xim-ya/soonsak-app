/* 영화, 시리즈 (드라마) 유형 enum */

export type ContentType = 'movie' | 'tv' | 'unknown';

/** DB에 실제 존재하는 콘텐츠 타입 (unknown 제외) */
export type KnownContentType = Exclude<ContentType, 'unknown'>;

interface ContentTypeConfig {
  label: string;
}

export const contentTypeConfigs: Record<ContentType, ContentTypeConfig> = {
  movie: { label: '영화' },
  tv: { label: '시리즈' },
  unknown: { label: '콘텐츠' },
};
