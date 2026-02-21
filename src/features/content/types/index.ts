import { ContentType, KnownContentType } from '@/presentation/types/content/contentType.enum';

/**
 * ISO 8601 형식의 타임스탬프 문자열 타입
 * Supabase에서 반환되는 timestamp 컬럼의 타입
 * @example '2024-01-15T12:30:00.000Z'
 */
type ISOTimestamp = string;

/**
 * 타이틀 로고 언어 타입
 * DB의 title_logo_lang 컬럼 enum과 대응
 */
type LogoLanguage = 'ko' | 'en';

/**
 * 콘텐츠/비디오 상태 enum
 * DB의 content_status_enum과 대응
 */
export const ContentStatus = {
  /** 검토 대기 */
  PENDING: 'pending',
  /** 확인 완료, 정상 노출 */
  CONFIRMED: 'confirmed',
  /** 거부됨 */
  REJECTED: 'rejected',
  /** 검토 필요 (신고 등) */
  NEEDS_REVIEW: 'needs_review',
} as const;

export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

/**
 * 상태별 라벨 (UI 표시용)
 */
export const ContentStatusLabel: Record<ContentStatus, string> = {
  [ContentStatus.PENDING]: '대기',
  [ContentStatus.CONFIRMED]: '승인',
  [ContentStatus.REJECTED]: '거부',
  [ContentStatus.NEEDS_REVIEW]: '검토 필요',
};

/**
 * 감독/출연진 정보 타입
 */
interface PersonDto {
  readonly id: number;
  readonly name: string;
  readonly profilePath?: string;
}

/**
 * 'contents' 테이블 컬럼과 1대1 대응이 되는 데이터 클래스
 */
interface ContentDto {
  readonly id: number;
  readonly contentType: ContentType;
  readonly title: string;
  readonly posterPath?: string;
  readonly releaseDate?: string;
  readonly genreIds?: number[];
  readonly uploadedAt?: ISOTimestamp;
  readonly titleChosung?: string;
  readonly titleNormalized?: string;
  readonly viewCount?: number;
  readonly playCount?: number;
  readonly tagline?: string;
  readonly backdropPath?: string;
  readonly originalLanguage?: string;
  readonly overview?: string;
  readonly voteAverage?: number;
  readonly popularity?: number;
  readonly originCountry?: string[];
  readonly directors?: PersonDto[];
  readonly mainCast?: PersonDto[];
  readonly titleLogo?: string;
  readonly titleLogoLang?: LogoLanguage;
  /** 콘텐츠 상태 */
  readonly status?: ContentStatus;
}

/**
 * 콘텐츠와 연결된 비디오 정보를 포함하는 DTO
 * Content + Video 조인 RPC 결과에 사용
 */
interface ContentWithVideoDto extends ContentDto {
  readonly runtime: number;
  readonly videoId: string;
}

/**
 * 'videos' 테이블 컬럼과 1대1 대응이 되는 데이터 클래스
 */
interface VideoDto {
  readonly id: string;
  readonly contentId: number;
  readonly contentType?: ContentType;
  readonly title: string;
  readonly runtime?: number;
  readonly thumbnailUrl?: string;
  readonly isPrimary: boolean;
  readonly channelId?: string;
  readonly includesEnding: boolean;
  readonly uploadedAt: ISOTimestamp;
  readonly updatedAt: ISOTimestamp;
  /** 비디오 상태 */
  readonly status?: ContentStatus;
}

/**
 * 비디오와 연결된 콘텐츠 정보를 포함하는 DTO
 * 채널 상세 화면에서 포스터 이미지와 콘텐츠 제목을 표시할 때 사용
 */
interface VideoWithContentDto extends VideoDto {
  readonly contentTitle: string;
  readonly contentPosterPath: string;
}

/**
 * 컬렉션 내 콘텐츠 ID 정보
 */
interface ContentIdItem {
  readonly id: number;
  readonly type: KnownContentType;
}

/**
 * 'content_collections' 테이블 컬럼과 1대1 대응이 되는 데이터 클래스
 */
interface ContentCollectionDto {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | undefined;
  readonly themeKeywords: string[] | undefined;
  readonly contentIds: ContentIdItem[];
  readonly displayOrder: number;
  readonly isActive: boolean;
}

/**
 * 컬렉션과 연결된 콘텐츠 상세 정보를 포함하는 DTO
 */
interface ContentCollectionWithContentsDto extends Omit<ContentCollectionDto, 'contentIds'> {
  readonly contents: ContentDto[];
}

export type {
  ISOTimestamp,
  LogoLanguage,
  ContentDto,
  ContentWithVideoDto,
  VideoDto,
  VideoWithContentDto,
  ContentIdItem,
  ContentCollectionDto,
  ContentCollectionWithContentsDto,
};

// ContentStatus는 위에서 export const와 export type으로 이미 내보냄
