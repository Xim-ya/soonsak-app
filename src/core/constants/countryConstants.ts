/**
 * countryConstants - 국가 코드 상수 정의
 *
 * ISO 3166-1 alpha-2 국가 코드와 한국어 이름을 매핑합니다.
 * 콘텐츠 필터에서 제작 국가 선택에 사용됩니다.
 */

interface CountryItem {
  readonly code: string;
  readonly name: string;
}

/** 필터에 표시할 국가 목록 (콘텐츠 수 상위) */
const COUNTRY_OPTIONS: readonly CountryItem[] = [
  { code: 'KR', name: '한국' },
  { code: 'US', name: '미국' },
  { code: 'GB', name: '영국' },
  { code: 'JP', name: '일본' },
  { code: 'FR', name: '프랑스' },
  { code: 'CA', name: '캐나다' },
  { code: 'DE', name: '독일' },
  { code: 'AU', name: '호주' },
  { code: 'ES', name: '스페인' },
  { code: 'CN', name: '중국' },
  { code: 'IT', name: '이탈리아' },
  { code: 'IN', name: '인도' },
  { code: 'TW', name: '대만' },
  { code: 'HK', name: '홍콩' },
] as const;

/** 국가 코드 -> 한국어 이름 매핑 */
const COUNTRY_NAME_MAP: Record<string, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map((item) => [item.code, item.name]),
);

export type { CountryItem };
export { COUNTRY_OPTIONS, COUNTRY_NAME_MAP };
