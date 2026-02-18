/**
 * 닉네임 Validation 규칙 및 정규식
 *
 * Flutter Regex.dart를 기반으로 구현되었습니다.
 * 모든 규칙은 불변 상수로 정의되어 있습니다.
 */

/** 닉네임 Validation 규칙 */
export const NICKNAME_RULES = {
  /** 최소 길이 */
  MIN_LENGTH: 2,
  /** 최대 길이 */
  MAX_LENGTH: 10,
  /** 허용 문자 패턴 (한글, 영문, 숫자, _, -) */
  VALID_PATTERN: /^[a-zA-Z0-9ㄱ-ㅎ가-힣_-]+$/,
  /** 공백 패턴 */
  SPACE_PATTERN: /\s/,
  /** 예약어 (사용 불가) */
  RESERVED_WORDS: ['운영자', '관리자', 'admin', 'plotz', '빠른탐색', 'quickExplore'] as const,
} as const;

/**
 * 비속어 정규식 패턴
 * Flutter Regex.dart의 fWordRegex 기반
 */
export const PROFANITY_PATTERN =
  /시발|씨발|시팔|씨팔|시벌|씨벌|씨바|시바|씹|좆|좃|존나|졸라|병신|븅신|빙신|ㅂㅅ|ㅄ|ㅅㅂ|ㅆㅂ|개새끼|개색|개세|개쌔|개새|걸레|창녀|창년|년|놈|ㄴㅁ|ㄱㅅㄲ|ㅗ|미친|ㅁㅊ|지랄|ㅈㄹ|꺼져|닥쳐|뒤져|디져|뒈져|fuck|shit|bitch|damn|ass|bastard|dick|pussy|cock|cunt|nigger|nigga|slut|whore|fck|fuk|sht|btch/i;

/** 닉네임 에러 메시지 */
export const NICKNAME_ERRORS = {
  EMPTY: '닉네임을 입력해주세요',
  TOO_SHORT: '닉네임은 2자 이상이어야 합니다',
  TOO_LONG: '닉네임은 10자 이하여야 합니다',
  HAS_SPACE: '닉네임에는 공백을 사용할 수 없습니다',
  INVALID_CHAR: '한글, 영문, 숫자, _, -만 사용할 수 있습니다',
  PROFANITY: '사용할 수 없는 단어가 포함되어 있습니다',
  RESERVED: '사용할 수 없는 닉네임입니다',
  DUPLICATE: '이미 사용 중인 닉네임입니다',
} as const;

/**
 * 닉네임 동기 Validation
 *
 * 중복 체크를 제외한 모든 규칙을 검증합니다.
 * 입력 중 실시간 체크에 사용됩니다.
 *
 * @param value 검증할 닉네임
 * @returns 에러 키 또는 null (유효한 경우)
 */
export function validateNicknameSync(value: string): keyof typeof NICKNAME_ERRORS | null {
  // 빈 값 체크
  if (!value || value.length === 0) {
    return 'EMPTY';
  }

  // 공백 체크 (가장 먼저 - 공백 포함 시 즉시 에러)
  if (NICKNAME_RULES.SPACE_PATTERN.test(value)) {
    return 'HAS_SPACE';
  }

  // 공백이 없으므로 trim 불필요, value 그대로 사용
  // 최소 길이 체크
  if (value.length < NICKNAME_RULES.MIN_LENGTH) {
    return 'TOO_SHORT';
  }

  // 최대 길이 체크
  if (value.length > NICKNAME_RULES.MAX_LENGTH) {
    return 'TOO_LONG';
  }

  // 허용 문자 체크
  if (!NICKNAME_RULES.VALID_PATTERN.test(value)) {
    return 'INVALID_CHAR';
  }

  // 비속어 체크
  if (PROFANITY_PATTERN.test(value)) {
    return 'PROFANITY';
  }

  // 예약어 체크
  const lowerValue = value.toLowerCase();
  const hasReserved = NICKNAME_RULES.RESERVED_WORDS.some((word) =>
    lowerValue.includes(word.toLowerCase()),
  );
  if (hasReserved) {
    return 'RESERVED';
  }

  return null;
}
