/**
 * useVersionVerification - 버전 검증 커스텀 훅
 *
 * 앱 버전 입력 및 검증 로직을 분리하여 관심사를 분리합니다.
 * Discriminated Union 패턴을 사용하여 상태를 명확하게 표현합니다.
 */

import { useState, useCallback, useEffect } from 'react';
import { adminPushApi } from '@/features/admin/api/adminPushApi';

// ============================================================================
// Types - Discriminated Union Pattern
// ============================================================================

/** 검증 전 상태 */
interface UnverifiedState {
  status: 'unverified';
}

/** 검증 중 상태 */
interface VerifyingState {
  status: 'verifying';
}

/** 검증 완료 상태 */
interface VerifiedState {
  status: 'verified';
  version: string | undefined; // undefined = 전체
  label: string;
  count: number;
}

/** 검증 실패 상태 */
interface ErrorState {
  status: 'error';
  version: string;
  label: string;
  message: string;
}

export type VerificationState = UnverifiedState | VerifyingState | VerifiedState | ErrorState;

// ============================================================================
// Helper Functions
// ============================================================================

/** 버전 문자열에서 "v" 접두사 제거 */
function normalizeVersion(input: string): string {
  const trimmed = input.trim();
  if (trimmed.toLowerCase().startsWith('v')) {
    return trimmed.slice(1);
  }
  return trimmed;
}

// ============================================================================
// Hook
// ============================================================================

interface UseVersionVerificationParams {
  /** 전체 활성 토큰 수 (전체 선택 시 사용) */
  totalActiveTokens: number;
}

interface UseVersionVerificationReturn {
  /** 버전 입력값 */
  versionInput: string;
  /** 검증 상태 */
  verificationState: VerificationState;
  /** 입력값 변경 핸들러 */
  handleInputChange: (text: string) => void;
  /** 버전 검증 실행 */
  verifyVersion: () => Promise<void>;
  /** 검증 완료 여부 */
  isVerified: boolean;
  /** 검증 중 여부 */
  isVerifying: boolean;
  /** 발송 가능 여부 (검증 완료 + 토큰 있음) */
  hasValidTokens: boolean;
  /** 검증된 버전 정보 (발송 시 사용) */
  getVerifiedVersion: () => { version: string | undefined; label: string; count: number } | null;
  /** 초기화 (모달 열 때 사용) */
  reset: (initialCount: number) => void;
}

export function useVersionVerification({
  totalActiveTokens,
}: UseVersionVerificationParams): UseVersionVerificationReturn {
  const [versionInput, setVersionInput] = useState('');
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'verified',
    version: undefined,
    label: '전체',
    count: totalActiveTokens,
  });

  // totalActiveTokens 변경 시 전체 대상 상태의 count 동기화
  useEffect(() => {
    setVerificationState((prev) => {
      // 전체 대상(version: undefined)이고 검증 완료 상태일 때만 count 업데이트
      if (prev.status === 'verified' && prev.version === undefined) {
        return { ...prev, count: totalActiveTokens };
      }
      return prev;
    });
  }, [totalActiveTokens]);

  // 입력값 변경 시 검증 상태 초기화
  const handleInputChange = useCallback((text: string) => {
    setVersionInput(text);
    setVerificationState({ status: 'unverified' });
  }, []);

  // 버전 검증 실행
  const verifyVersion = useCallback(async () => {
    const normalizedVersion = normalizeVersion(versionInput);

    // 빈 입력 = 전체 대상
    if (!normalizedVersion) {
      setVerificationState({
        status: 'verified',
        version: undefined,
        label: '전체',
        count: totalActiveTokens,
      });
      return;
    }

    setVerificationState({ status: 'verifying' });

    try {
      const versions = await adminPushApi.getAvailableAppVersions();
      const versionInfo = versions.find((v) => v.version === normalizedVersion);

      setVerificationState({
        status: 'verified',
        version: normalizedVersion,
        label: `v${normalizedVersion}`,
        count: versionInfo?.count ?? 0,
      });
    } catch (error) {
      console.error('[useVersionVerification] 버전 조회 실패:', error);
      setVerificationState({
        status: 'error',
        version: normalizedVersion,
        label: `v${normalizedVersion}`,
        message: '버전 조회에 실패했습니다',
      });
    }
  }, [versionInput, totalActiveTokens]);

  // 초기화 함수
  const reset = useCallback((initialCount: number) => {
    setVersionInput('');
    setVerificationState({
      status: 'verified',
      version: undefined,
      label: '전체',
      count: initialCount,
    });
  }, []);

  // Derived states
  const isVerified = verificationState.status === 'verified';
  const isVerifying = verificationState.status === 'verifying';
  const hasValidTokens = isVerified && verificationState.count > 0;

  // 발송용 검증된 버전 정보 가져오기
  const getVerifiedVersion = useCallback(() => {
    if (verificationState.status !== 'verified') return null;
    return {
      version: verificationState.version,
      label: verificationState.label,
      count: verificationState.count,
    };
  }, [verificationState]);

  return {
    versionInput,
    verificationState,
    handleInputChange,
    verifyVersion,
    isVerified,
    isVerifying,
    hasValidTokens,
    getVerifiedVersion,
    reset,
  };
}
