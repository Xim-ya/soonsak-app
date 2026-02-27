/**
 * useLiquidGlass - iOS 26+ Liquid Glass 지원 여부 확인
 *
 * @callstack/liquid-glass 네이티브 모듈의 사용 가능 여부를 확인합니다.
 * Xcode 26 SDK로 빌드된 앱에서만 작동합니다.
 */

import { ComponentType } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';

interface LiquidGlassViewProps {
  effect: 'regular' | 'clear';
  style?: StyleProp<ViewStyle>;
}

interface LiquidGlassState {
  isSupported: boolean;
  LiquidGlassView: ComponentType<LiquidGlassViewProps> | null;
}

// TODO: Xcode 26 업데이트 후 아래 주석 해제
// iOS 26 이상인지 체크 (iOS 26 = version 26.0)
// const IOS_VERSION = Platform.OS === 'ios' ? parseFloat(Platform.Version as string) : 0;
// const IS_IOS_26_OR_LATER = IOS_VERSION >= 26;

// 현재는 Liquid Glass 비활성화 (Xcode 26 필요)
// Xcode 업데이트 후 아래 코드 활성화:
/*
if (IS_IOS_26_OR_LATER) {
  try {
    const liquidGlass = require('@callstack/liquid-glass');

    if (typeof liquidGlass.isLiquidGlassSupported === 'function') {
      const isSupported = liquidGlass.isLiquidGlassSupported();
      liquidGlassModule = {
        isSupported,
        LiquidGlassView: isSupported ? liquidGlass.LiquidGlassView : null,
      };
    }
  } catch {
    // 네이티브 모듈 로드 실패 시 fallback
  }
}
*/

// 임시: 항상 BlurView 사용
const liquidGlassModule: LiquidGlassState = { isSupported: false, LiquidGlassView: null };

/**
 * iOS 26+ Liquid Glass 지원 여부를 확인하는 hook
 *
 * @returns isSupported - Liquid Glass 사용 가능 여부
 * @returns LiquidGlassView - Liquid Glass 컴포넌트 (없으면 null)
 *
 * @example
 * const { isSupported, LiquidGlassView } = useLiquidGlass();
 * if (isSupported && LiquidGlassView) {
 *   return <LiquidGlassView effect="regular" style={styles.glass} />;
 * }
 */
export function useLiquidGlass(): LiquidGlassState {
  return liquidGlassModule;
}
