/**
 * useDialog - 다이얼로그 커스텀 훅
 *
 * Toss Frontend Fundamentals의 응집도 원칙을 적용한 선언적 다이얼로그 훅입니다.
 * Promise 기반으로 다이얼로그 결과를 async/await로 처리할 수 있습니다.
 *
 * Flutter AppDialog의 factory pattern(singleBtn, dividedBtn)을
 * React의 함수형 패턴(showDialog, showConfirmDialog)으로 변환했습니다.
 *
 * @example
 * // 단일 버튼 다이얼로그 (알림)
 * const { showDialog } = useDialog();
 *
 * const handleNotify = async () => {
 *   await showDialog({
 *     title: '알림',
 *     description: '저장되었습니다.',
 *   });
 *   // 다이얼로그가 닫힌 후 실행
 *   navigation.goBack();
 * };
 *
 * @example
 * // 분리된 버튼 다이얼로그 (확인/취소)
 * const { showConfirmDialog } = useDialog();
 *
 * const handleDelete = async () => {
 *   const result = await showConfirmDialog({
 *     title: '삭제 확인',
 *     description: '이 항목을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.',
 *     leftButtonText: '취소',
 *     rightButtonText: '삭제',
 *   });
 *
 *   if (result === 'right') {
 *     await deleteItem();
 *     showSnackbar('삭제되었습니다.');
 *   }
 * };
 *
 * @example
 * // 배경 터치 구분이 필요한 경우
 * const result = await showConfirmDialog({
 *   title: '변경사항 저장',
 *   description: '변경사항을 저장하시겠습니까?',
 *   leftButtonText: '저장 안 함',
 *   rightButtonText: '저장',
 * });
 *
 * switch (result) {
 *   case 'right':
 *     await saveChanges();
 *     break;
 *   case 'left':
 *     discardChanges();
 *     break;
 *   case 'backdrop':
 *     // 배경 터치로 닫음 - 아무 동작 안 함
 *     break;
 * }
 *
 * (Toss SLASH 21 - 진유림: "선언적 팝업" 패턴 적용)
 */

import { useContext } from 'react';
import { DialogContext, type DialogContextValue } from './DialogProvider';

/**
 * 다이얼로그 훅
 *
 * @throws {Error} DialogProvider 외부에서 사용 시 에러 발생
 * @returns DialogContextValue - showDialog, showConfirmDialog, closeDialog
 */
function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);

  if (context === null) {
    throw new Error(
      'useDialog must be used within a DialogProvider. ' +
        'Wrap your app with <DialogProvider> to use this hook.',
    );
  }

  return context;
}

export { useDialog };
