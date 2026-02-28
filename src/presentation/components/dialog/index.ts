/**
 * AppDialog 모듈 - 공용 다이얼로그 시스템
 *
 * Flutter AppDialog를 React Native로 마이그레이션한 모듈입니다.
 * 플랫폼별로 최적화된 다이얼로그를 제공합니다:
 * - iOS: 기본 Cupertino 스타일 (Alert.alert)
 * - Android: 커스텀 AppDialog
 *
 * @example
 * // 1. App.tsx에서 Provider 설정
 * import { DialogProvider } from '@/presentation/components/dialog';
 *
 * function App() {
 *   return (
 *     <DialogProvider>
 *       <Navigation />
 *     </DialogProvider>
 *   );
 * }
 *
 * @example
 * // 2. 컴포넌트에서 사용
 * import { useDialog } from '@/presentation/components/dialog';
 *
 * function MyComponent() {
 *   const { showDialog, showConfirmDialog } = useDialog();
 *
 *   // 단일 버튼 다이얼로그
 *   const handleAlert = async () => {
 *     await showDialog({
 *       title: '알림',
 *       description: '저장되었습니다.',
 *     });
 *   };
 *
 *   // 분리된 버튼 다이얼로그
 *   const handleDelete = async () => {
 *     const result = await showConfirmDialog({
 *       title: '삭제 확인',
 *       description: '정말 삭제하시겠습니까?',
 *       leftButtonText: '취소',
 *       rightButtonText: '삭제',
 *     });
 *
 *     if (result === 'right') {
 *       await deleteItem();
 *     }
 *   };
 * }
 *
 * @example
 * // 3. AppDialog 직접 사용 (Android 전용, 권장하지 않음)
 * import { AppDialog } from '@/presentation/components/dialog';
 *
 * <AppDialog
 *   visible={visible}
 *   title="제목"
 *   description="설명"
 *   buttonText="확인"
 *   onButtonPress={handleClose}
 * />
 */

// Provider & Context
export { DialogProvider, DialogContext, type DialogContextValue } from './DialogProvider';

// Hook
export { useDialog } from './useDialog';

// Component (Android 전용)
export { AppDialog, type AppDialogProps } from './AppDialog';

// Types
export type {
  SingleButtonConfig,
  DividedButtonConfig,
  DialogOptions,
  SingleButtonResult,
  DividedButtonResult,
} from './types';

// 기존 LoginPromptDialog도 유지
export { LoginPromptDialog } from './LoginPromptDialog';
