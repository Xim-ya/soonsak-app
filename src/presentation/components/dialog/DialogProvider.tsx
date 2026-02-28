/**
 * DialogProvider - 전역 다이얼로그 상태 관리 Provider
 *
 * Toss Frontend Fundamentals의 응집도 원칙을 적용하여,
 * 다이얼로그 상태 관리와 렌더링을 하나의 Provider로 응집합니다.
 *
 * Promise 기반의 선언적 다이얼로그 패턴을 제공하여,
 * 컴포넌트에서 다이얼로그 상태를 직접 관리할 필요 없이
 * async/await로 다이얼로그 결과를 받을 수 있습니다.
 *
 * **플랫폼별 다이얼로그:**
 * - iOS: 기본 Cupertino 스타일 (Alert.alert)
 * - Android: 커스텀 AppDialog
 *
 * @example
 * // App.tsx에서 Provider 설정
 * <DialogProvider>
 *   <App />
 * </DialogProvider>
 *
 * @example
 * // 컴포넌트에서 사용
 * function MyComponent() {
 *   const { showDialog, showConfirmDialog } = useDialog();
 *
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
 * (Toss SLASH 21 - 진유림: "응집된 접근 - 한눈에 파악" 패턴 적용)
 * (react-native-expert - 규칙 7.1: Platform.select로 스타일 분기)
 */

import React, { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { AppDialog } from './AppDialog';
import type {
  DividedButtonConfig,
  DividedButtonResult,
  DialogState,
  SingleButtonConfig,
  SingleButtonResult,
} from './types';

/** iOS 여부 판별 */
const IS_IOS = Platform.OS === 'ios';

/** DialogContext 타입 */
interface DialogContextValue {
  /**
   * 단일 버튼 다이얼로그 표시
   * @returns Promise<SingleButtonResult> - 'confirm' | 'backdrop'
   */
  readonly showDialog: (config: SingleButtonConfig) => Promise<SingleButtonResult>;

  /**
   * 분리된 버튼(확인/취소) 다이얼로그 표시
   * @returns Promise<DividedButtonResult> - 'left' | 'right' | 'backdrop'
   */
  readonly showConfirmDialog: (config: DividedButtonConfig) => Promise<DividedButtonResult>;

  /** 다이얼로그 닫기 (내부용) */
  readonly closeDialog: () => void;
}

/** 초기 다이얼로그 상태 */
const INITIAL_DIALOG_STATE: DialogState = {
  visible: false,
  config: null,
  isDivided: false,
  resolve: null,
};

/** DialogContext */
const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogProviderProps {
  readonly children: ReactNode;
}

function DialogProvider({ children }: DialogProviderProps): React.ReactElement {
  const [dialogState, setDialogState] = useState<DialogState>(INITIAL_DIALOG_STATE);

  /** 다이얼로그 닫기 및 상태 초기화 */
  const closeDialog = useCallback(() => {
    setDialogState(INITIAL_DIALOG_STATE);
  }, []);

  /** 결과 반환 및 다이얼로그 닫기 */
  const resolveAndClose = useCallback(
    (result: DividedButtonResult | SingleButtonResult) => {
      dialogState.resolve?.(result);
      closeDialog();
    },
    [dialogState.resolve, closeDialog],
  );

  /**
   * 단일 버튼 다이얼로그 표시
   * - iOS: Alert.alert (Cupertino 스타일)
   * - Android: AppDialog (커스텀)
   */
  const showDialog = useCallback((config: SingleButtonConfig): Promise<SingleButtonResult> => {
    return new Promise<SingleButtonResult>((resolve) => {
      if (IS_IOS) {
        // iOS: 기본 Cupertino Alert 사용
        const message = config.subTitle
          ? `${config.subTitle}${config.description ? `\n\n${config.description}` : ''}`
          : config.description;

        Alert.alert(config.title, message, [
          {
            text: config.buttonText ?? '확인',
            onPress: () => resolve('confirm'),
            style: 'default',
          },
        ]);
      } else {
        // Android: 커스텀 AppDialog 사용
        setDialogState({
          visible: true,
          config,
          isDivided: false,
          resolve: resolve as (result: DividedButtonResult | SingleButtonResult) => void,
        });
      }
    });
  }, []);

  /**
   * 분리된 버튼 다이얼로그 표시
   * - iOS: Alert.alert (Cupertino 스타일)
   * - Android: AppDialog (커스텀)
   */
  const showConfirmDialog = useCallback(
    (config: DividedButtonConfig): Promise<DividedButtonResult> => {
      return new Promise<DividedButtonResult>((resolve) => {
        if (IS_IOS) {
          // iOS: 기본 Cupertino Alert 사용
          const message = config.subTitle
            ? `${config.subTitle}${config.description ? `\n\n${config.description}` : ''}`
            : config.description;

          Alert.alert(
            config.title,
            message,
            [
              {
                text: config.leftButtonText,
                onPress: () => resolve('left'),
                style: 'cancel',
              },
              {
                text: config.rightButtonText,
                onPress: () => resolve('right'),
                style: 'default',
              },
            ],
            { cancelable: true, onDismiss: () => resolve('backdrop') },
          );
        } else {
          // Android: 커스텀 AppDialog 사용
          setDialogState({
            visible: true,
            config,
            isDivided: true,
            resolve: resolve as (result: DividedButtonResult | SingleButtonResult) => void,
          });
        }
      });
    },
    [],
  );

  /** Context 값 메모이제이션 */
  const contextValue = useMemo<DialogContextValue>(
    () => ({
      showDialog,
      showConfirmDialog,
      closeDialog,
    }),
    [showDialog, showConfirmDialog, closeDialog],
  );

  /** 배경 터치 핸들러 */
  const handleBackdropPress = useCallback(() => {
    resolveAndClose('backdrop');
  }, [resolveAndClose]);

  /** 단일 버튼 클릭 핸들러 */
  const handleButtonPress = useCallback(() => {
    resolveAndClose('confirm');
  }, [resolveAndClose]);

  /** 왼쪽 버튼 클릭 핸들러 */
  const handleLeftButtonPress = useCallback(() => {
    resolveAndClose('left');
  }, [resolveAndClose]);

  /** 오른쪽 버튼 클릭 핸들러 */
  const handleRightButtonPress = useCallback(() => {
    resolveAndClose('right');
  }, [resolveAndClose]);

  // 타입 안전을 위한 분기 처리
  const isDivided = dialogState.isDivided;
  const config = dialogState.config;

  // 분리된 버튼 다이얼로그인지 확인하는 타입 가드
  const isDividedConfig = (cfg: typeof config): cfg is DividedButtonConfig => {
    return cfg !== null && 'leftButtonText' in cfg && 'rightButtonText' in cfg;
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {/* Android 전용: 커스텀 AppDialog 렌더링 */}
      {/* iOS는 Alert.alert 사용하므로 별도 렌더링 불필요 */}
      {!IS_IOS && dialogState.visible && config !== null && (
        <>
          {isDivided && isDividedConfig(config) ? (
            <AppDialog
              visible={dialogState.visible}
              title={config.title}
              {...(config.subTitle && { subTitle: config.subTitle })}
              {...(config.description && { description: config.description })}
              isDivided
              leftButtonText={config.leftButtonText}
              rightButtonText={config.rightButtonText}
              onLeftButtonPress={handleLeftButtonPress}
              onRightButtonPress={handleRightButtonPress}
              onBackdropPress={handleBackdropPress}
            />
          ) : (
            <AppDialog
              visible={dialogState.visible}
              title={config.title}
              {...(config.subTitle && { subTitle: config.subTitle })}
              {...(config.description && { description: config.description })}
              {...((config as SingleButtonConfig).buttonText && {
                buttonText: (config as SingleButtonConfig).buttonText,
              })}
              onButtonPress={handleButtonPress}
              onBackdropPress={handleBackdropPress}
            />
          )}
        </>
      )}
    </DialogContext.Provider>
  );
}

export { DialogProvider, DialogContext };
export type { DialogContextValue };
