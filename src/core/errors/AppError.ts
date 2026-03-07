import { type ErrorCode } from './errorCodes';
import { getErrorMessage } from './errorMessages';

/**
 * AppError - 앱 공통 에러 클래스
 *
 * 모든 API 에러는 이 클래스를 사용하여 일관된 형태로 throw합니다.
 * QueryClient의 전역 에러 핸들러에서 이 타입을 감지하여 스낵바를 표시합니다.
 *
 * @example
 * // 기본 사용법
 * throw new AppError(
 *   ERROR_CODES.CONTENT_FETCH_ERROR,
 *   '콘텐츠를 불러오는데 실패했습니다',
 *   originalError
 * );
 *
 * // 헬퍼 함수 사용
 * throw createAppError(ERROR_CODES.CONTENT_FETCH_ERROR, originalError);
 */
export class AppError extends Error {
  /** 에러 코드 (ERROR_CODES 상수 사용) */
  public readonly code: string;
  /** 사용자에게 표시할 메시지 */
  public readonly userMessage: string;
  /** 원본 에러 (디버깅용) */
  public readonly originalError?: unknown;

  constructor(code: string, userMessage: string, originalError?: unknown) {
    super(userMessage, { cause: originalError });
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.originalError = originalError;
  }

  /** 사용자 취소 에러인지 확인 */
  get isUserCancelled(): boolean {
    return this.code === 'USER_CANCELLED' || this.code === 'AUTH_CANCELLED';
  }

  /** 네트워크 에러인지 확인 */
  get isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }
}

/**
 * AppError 타입 가드
 *
 * @param error - 확인할 에러 객체
 * @returns AppError 타입 여부
 *
 * @example
 * if (isAppError(error)) {
 *   console.log(error.code, error.userMessage);
 * }
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * AppError 생성 헬퍼
 *
 * 에러 코드에 해당하는 메시지를 자동으로 설정합니다.
 *
 * @param code - 에러 코드 (ERROR_CODES 상수 사용)
 * @param originalError - 원본 에러 (선택)
 * @returns AppError 인스턴스
 *
 * @example
 * // 기본 사용
 * throw createAppError(ERROR_CODES.CONTENT_FETCH_ERROR, originalError);
 *
 * // 원본 에러 없이 사용
 * throw createAppError(ERROR_CODES.CONTENT_NOT_FOUND);
 */
export function createAppError(code: ErrorCode, originalError?: unknown): AppError {
  return new AppError(code, getErrorMessage(code), originalError);
}
