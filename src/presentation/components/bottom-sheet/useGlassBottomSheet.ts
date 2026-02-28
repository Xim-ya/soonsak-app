/**
 * useGlassBottomSheet - GlassBottomSheet 상태 관리 훅
 *
 * 바텀시트의 열기/닫기 상태를 관리하는 커스텀 훅입니다.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isVisible, open, close } = useGlassBottomSheet();
 *
 *   return (
 *     <>
 *       <Button onPress={open}>열기</Button>
 *       <GlassBottomSheet visible={isVisible} onClose={close}>
 *         <Content />
 *       </GlassBottomSheet>
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';

interface UseGlassBottomSheetReturn {
  /** 바텀시트 표시 여부 */
  isVisible: boolean;
  /** 바텀시트 열기 */
  open: () => void;
  /** 바텀시트 닫기 */
  close: () => void;
  /** 바텀시트 토글 */
  toggle: () => void;
}

/**
 * GlassBottomSheet 상태 관리 훅
 *
 * @param initialVisible - 초기 표시 상태 (기본: false)
 * @returns 바텀시트 상태 및 제어 함수
 */
function useGlassBottomSheet(initialVisible = false): UseGlassBottomSheetReturn {
  const [isVisible, setIsVisible] = useState(initialVisible);

  const open = useCallback(() => {
    setIsVisible(true);
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  return {
    isVisible,
    open,
    close,
    toggle,
  };
}

export { useGlassBottomSheet };
export type { UseGlassBottomSheetReturn };
