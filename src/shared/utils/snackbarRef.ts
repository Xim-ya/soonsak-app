/**
 * 전역 스낵바 참조
 *
 * QueryClient의 에러 핸들러와 같이 React Context 외부에서
 * 스낵바를 호출해야 할 때 사용합니다.
 *
 * @example
 * // QueryClient 에러 핸들러에서
 * showGlobalSnackbar('에러가 발생했습니다');
 */

import { SnackbarLogger } from '@/shared/utils/logger';

type SnackbarRef = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
} | null;

let snackbarRef: SnackbarRef = null;

/**
 * SnackbarProvider에서 호출하여 전역 참조를 설정합니다.
 * @internal
 */
export const setSnackbarRef = (ref: SnackbarRef) => {
  snackbarRef = ref;
};

/**
 * 전역 에러 스낵바 표시
 *
 * @param message - 표시할 메시지
 *
 * @example
 * showGlobalSnackbar('콘텐츠를 불러오는데 실패했습니다');
 */
export const showGlobalSnackbar = (message: string) => {
  if (!snackbarRef) {
    SnackbarLogger.warn('Ref가 설정되지 않았습니다:', message);
    return;
  }
  snackbarRef.showError(message);
};

/**
 * 전역 성공 스낵바 표시
 *
 * @param message - 표시할 메시지
 */
export const showGlobalSuccess = (message: string) => {
  if (!snackbarRef) {
    SnackbarLogger.warn('Ref가 설정되지 않았습니다:', message);
    return;
  }
  snackbarRef.showSuccess(message);
};

/**
 * 전역 정보 스낵바 표시 (회색)
 *
 * @param message - 표시할 메시지
 */
export const showGlobalInfo = (message: string) => {
  if (!snackbarRef) {
    SnackbarLogger.warn('Ref가 설정되지 않았습니다:', message);
    return;
  }
  snackbarRef.showInfo(message);
};
