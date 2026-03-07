/**
 * useNicknameValidation - 닉네임 Validation 훅
 *
 * 닉네임 입력값에 대한 실시간 검증과 비동기 중복 체크를 제공합니다.
 *
 * @example
 * const { validate, validateAsync, getErrorMessage } = useNicknameValidation();
 *
 * // 실시간 검증 (입력 중)
 * const errorKey = validate(inputValue);
 *
 * // 저장 전 비동기 검증 (중복 체크 포함)
 * const errorKey = await validateAsync(inputValue, userId);
 */

import { useCallback } from 'react';
import { validateNicknameSync, NICKNAME_ERRORS } from '../constants/nicknameValidation';
import { userApi } from '../api/userApi';
import { UserLogger } from '@/core/utils';
import type { NicknameValidationError } from '../types';

interface UseNicknameValidationReturn {
  /**
   * 동기 Validation (입력 중 실시간 체크)
   * 중복 체크를 제외한 모든 규칙을 검증합니다.
   */
  validate: (value: string) => NicknameValidationError | null;

  /**
   * 비동기 Validation (저장 시 중복 체크 포함)
   * 모든 규칙과 서버 중복 체크를 수행합니다.
   */
  validateAsync: (value: string, excludeUserId?: string) => Promise<NicknameValidationError | null>;

  /**
   * 에러 키로 메시지 조회
   */
  getErrorMessage: (errorKey: NicknameValidationError | null) => string | null;
}

/**
 * 닉네임 Validation 훅
 *
 * 입력값 검증 로직을 캡슐화하여 재사용성을 높입니다.
 */
export function useNicknameValidation(): UseNicknameValidationReturn {
  /**
   * 동기 Validation
   */
  const validate = useCallback((value: string): NicknameValidationError | null => {
    return validateNicknameSync(value) as NicknameValidationError | null;
  }, []);

  /**
   * 비동기 Validation (중복 체크 포함)
   */
  const validateAsync = useCallback(
    async (value: string, excludeUserId?: string): Promise<NicknameValidationError | null> => {
      // 먼저 동기 검증 수행
      const syncError = validate(value);
      if (syncError) {
        return syncError;
      }

      // 서버 중복 체크
      try {
        const isDuplicate = await userApi.checkNicknameDuplicate(value, excludeUserId);
        if (isDuplicate) {
          return 'DUPLICATE';
        }
      } catch {
        // 중복 체크 실패 시 일단 통과 (저장 시 서버에서 재검증)
        UserLogger.error('닉네임 중복 체크 실패');
      }

      return null;
    },
    [validate],
  );

  /**
   * 에러 메시지 조회
   */
  const getErrorMessage = useCallback((errorKey: NicknameValidationError | null): string | null => {
    if (!errorKey) return null;
    return NICKNAME_ERRORS[errorKey] ?? null;
  }, []);

  return {
    validate,
    validateAsync,
    getErrorMessage,
  };
}
