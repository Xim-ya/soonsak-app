/**
 * AppDialog 타입 정의
 *
 * Flutter AppDialog 모듈을 React Native로 마이그레이션한 타입 시스템입니다.
 * iOS Cupertino 스타일 다이얼로그의 두 가지 변형을 지원합니다:
 * - SingleButton: 단일 확인 버튼
 * - DividedButton: 좌/우 두 개의 버튼
 */

/** 다이얼로그 공통 속성 */
interface DialogBaseProps {
  /** 다이얼로그 제목 (필수) */
  readonly title: string;
  /** 부제목 (선택) */
  readonly subTitle?: string;
  /** 설명 텍스트 (선택) */
  readonly description?: string;
}

/** 단일 버튼 다이얼로그 설정 */
interface SingleButtonConfig extends DialogBaseProps {
  /** 버튼 텍스트 (기본값: '확인') */
  readonly buttonText?: string;
}

/** 분리된 버튼 다이얼로그 설정 */
interface DividedButtonConfig extends DialogBaseProps {
  /** 왼쪽 버튼 텍스트 (필수) */
  readonly leftButtonText: string;
  /** 오른쪽 버튼 텍스트 (필수) */
  readonly rightButtonText: string;
}

/** useDialog 훅에서 사용하는 다이얼로그 옵션 */
type DialogOptions = SingleButtonConfig | DividedButtonConfig;

/** 분리된 버튼 다이얼로그의 결과 */
type DividedButtonResult = 'left' | 'right' | 'backdrop';

/** 단일 버튼 다이얼로그의 결과 */
type SingleButtonResult = 'confirm' | 'backdrop';

/** 내부 상태 관리용 다이얼로그 설정 */
interface DialogState {
  readonly visible: boolean;
  readonly config: DialogOptions | null;
  readonly isDivided: boolean;
  readonly resolve: ((result: DividedButtonResult | SingleButtonResult) => void) | null;
}

export type {
  DialogBaseProps,
  SingleButtonConfig,
  DividedButtonConfig,
  DialogOptions,
  DividedButtonResult,
  SingleButtonResult,
  DialogState,
};
