/**
 * ProfileSetupProvider - 프로필 설정 화면 상태 관리 프로바이더
 *
 * 프로필 설정에 필요한 모든 상태와 액션을 Context로 제공합니다.
 * 하위 컴포넌트에서 props drilling 없이 상태에 접근할 수 있습니다.
 *
 * @example
 * <ProfileSetupProvider mode="initial">
 *   <ProfileSetupContent />
 * </ProfileSetupProvider>
 */

import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react';
import { useProfileSetup } from '../_hooks/useProfileSetup';
import type { ProfileSetupMode } from '@/features/user/types';
import type { ButtonState } from '@/presentation/components/button';
import { analyticsService } from '@/shared/analytics';

/** Context 타입 정의 */
interface ProfileSetupContextType {
  /** 현재 닉네임 입력값 */
  readonly nickname: string;
  /** 닉네임 변경 핸들러 */
  readonly setNickname: (value: string) => void;
  /** 표시할 아바타 URL (새로 선택한 이미지 > 기존 이미지) */
  readonly avatarUrl: string | undefined;
  /** 에러 메시지 */
  readonly error: string | null;
  /** 저장 중 로딩 상태 */
  readonly isLoading: boolean;
  /** 유효한 상태 (저장 가능) */
  readonly isValid: boolean;
  /** 변경 사항 있는지 (수정 모드용) */
  readonly isChanged: boolean;
  /** 이미지 선택 핸들러 */
  readonly handlePickImage: () => Promise<void>;
  /** 저장 핸들러 */
  readonly handleSubmit: () => Promise<void>;
  /** 현재 모드 */
  readonly mode: ProfileSetupMode;
  /** 버튼 텍스트 */
  readonly buttonText: string;
  /** 뒤로가기 버튼 표시 여부 */
  readonly showBackButton: boolean;
  /** 버튼 활성화 여부 */
  readonly isButtonEnabled: boolean;
  /** 버튼 상태 */
  readonly buttonState: ButtonState;
  /** 권한 다이얼로그 표시 여부 */
  readonly isPermissionDialogVisible: boolean;
  /** 권한 다이얼로그 닫기 */
  readonly closePermissionDialog: () => void;
  /** 설정 페이지로 이동 */
  readonly openSettings: () => void;
  /** 설정 열기 실패 다이얼로그 표시 여부 */
  readonly isSettingsErrorDialogVisible: boolean;
  /** 설정 열기 실패 다이얼로그 닫기 */
  readonly closeSettingsErrorDialog: () => void;
}

const ProfileSetupContext = createContext<ProfileSetupContextType | undefined>(undefined);

interface ProfileSetupProviderProps {
  readonly children: ReactNode;
  readonly mode: ProfileSetupMode;
}

/**
 * 프로필 설정 프로바이더
 */
export function ProfileSetupProvider({
  children,
  mode,
}: ProfileSetupProviderProps): React.ReactElement {
  const {
    nickname,
    setNickname,
    avatarUrl,
    error,
    isLoading,
    isValid,
    isChanged,
    handlePickImage,
    handleSubmit,
    isPermissionDialogVisible,
    closePermissionDialog,
    openSettings,
    isSettingsErrorDialogVisible,
    closeSettingsErrorDialog,
  } = useProfileSetup({ mode });

  // 프로필 설정 화면 진입 이벤트 로깅
  useEffect(() => {
    analyticsService.profileSetupStart({ mode });
  }, [mode]);

  // 모드별 UI 텍스트
  const buttonText = mode === 'initial' ? '시작하기' : '저장';
  const showBackButton = mode === 'edit';

  // 버튼 활성화 조건
  const isButtonEnabled = mode === 'initial' ? isValid : isValid && isChanged;

  // 버튼 상태 계산
  const buttonState: ButtonState = useMemo(() => {
    if (isLoading) return 'loading';
    if (isButtonEnabled) return 'enabled';
    return 'disabled';
  }, [isLoading, isButtonEnabled]);

  const contextValue: ProfileSetupContextType = useMemo(
    () => ({
      nickname,
      setNickname,
      avatarUrl,
      error,
      isLoading,
      isValid,
      isChanged,
      handlePickImage,
      handleSubmit,
      mode,
      buttonText,
      showBackButton,
      isButtonEnabled,
      buttonState,
      isPermissionDialogVisible,
      closePermissionDialog,
      openSettings,
      isSettingsErrorDialogVisible,
      closeSettingsErrorDialog,
    }),
    [
      nickname,
      setNickname,
      avatarUrl,
      error,
      isLoading,
      isValid,
      isChanged,
      handlePickImage,
      handleSubmit,
      mode,
      buttonText,
      showBackButton,
      isButtonEnabled,
      buttonState,
      isPermissionDialogVisible,
      closePermissionDialog,
      openSettings,
      isSettingsErrorDialogVisible,
      closeSettingsErrorDialog,
    ],
  );

  return (
    <ProfileSetupContext.Provider value={contextValue}>{children}</ProfileSetupContext.Provider>
  );
}

/**
 * useProfileSetupContext - 프로필 설정 Context 접근 훅
 *
 * ProfileSetupProvider 내부에서만 사용 가능합니다.
 *
 * @example
 * const { nickname, setNickname, error } = useProfileSetupContext();
 */
export function useProfileSetupContext(): ProfileSetupContextType {
  const context = useContext(ProfileSetupContext);
  if (context === undefined) {
    throw new Error('useProfileSetupContext must be used within a ProfileSetupProvider');
  }
  return context;
}
