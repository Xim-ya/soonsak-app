/**
 * useLiquidGlass - iOS 26+ Liquid Glass 지원 여부 확인
 *
 * @callstack/liquid-glass 네이티브 모듈의 사용 가능 여부를 확인합니다.
 * Xcode 26 SDK로 빌드된 앱에서만 작동합니다.
 */

import { ComponentType, ReactNode } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { LiquidGlassLogger } from '@/core/utils';

interface LiquidGlassViewProps {
  effect: 'regular' | 'clear';
  style?: StyleProp<ViewStyle>;
  colorScheme?: 'light' | 'dark' | 'system';
  interactive?: boolean;
  children?: ReactNode;
}

interface LiquidGlassState {
  isSupported: boolean;
  LiquidGlassView: ComponentType<LiquidGlassViewProps> | null;
}

// iOS 26 이상인지 체크 (iOS 26 = version 26.0)
const IOS_VERSION = Platform.OS === 'ios' ? parseFloat(Platform.Version as string) : 0;
const IS_IOS_26_OR_LATER = IOS_VERSION >= 26;

// 디버그 로그
LiquidGlassLogger.log('Platform:', Platform.OS);
LiquidGlassLogger.log('iOS Version:', IOS_VERSION);
LiquidGlassLogger.log('IS_IOS_26_OR_LATER:', IS_IOS_26_OR_LATER);

// Liquid Glass 모듈 초기화
let liquidGlassModule: LiquidGlassState = { isSupported: false, LiquidGlassView: null };

if (IS_IOS_26_OR_LATER) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const liquidGlass = require('@callstack/liquid-glass');

    LiquidGlassLogger.log('Module loaded:', !!liquidGlass);
    LiquidGlassLogger.log(
      'isLiquidGlassSupported type:',
      typeof liquidGlass.isLiquidGlassSupported,
    );
    LiquidGlassLogger.log(
      'isLiquidGlassSupported value:',
      liquidGlass.isLiquidGlassSupported,
    );

    // isLiquidGlassSupported가 함수일 수도 있고 boolean일 수도 있음
    const isSupported =
      typeof liquidGlass.isLiquidGlassSupported === 'function'
        ? liquidGlass.isLiquidGlassSupported()
        : Boolean(liquidGlass.isLiquidGlassSupported);

    LiquidGlassLogger.log('isSupported:', isSupported);
    LiquidGlassLogger.log('LiquidGlassView:', !!liquidGlass.LiquidGlassView);

    liquidGlassModule = {
      isSupported,
      LiquidGlassView: isSupported ? liquidGlass.LiquidGlassView : null,
    };
  } catch (error) {
    // 네이티브 모듈 로드 실패 시 fallback
    LiquidGlassLogger.log('Error loading module:', error);
  }
}

/**
 * iOS 26+ Liquid Glass 지원 여부를 확인하는 hook
 *
 * @returns isSupported - Liquid Glass 사용 가능 여부
 * @returns LiquidGlassView - Liquid Glass 컴포넌트 (없으면 null)
 *
 * @example
 * const { isSupported, LiquidGlassView } = useLiquidGlass();
 * if (isSupported && LiquidGlassView) {
 *   return <LiquidGlassView effect="regular" colorScheme="dark" style={styles.glass} />;
 * }
 */
export function useLiquidGlass(): LiquidGlassState {
  return liquidGlassModule;
}
