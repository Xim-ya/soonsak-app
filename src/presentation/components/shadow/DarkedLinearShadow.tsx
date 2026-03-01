import { LinearGradient } from 'expo-linear-gradient';

/**
 * 검정색 그라데이션 그림자 컴포넌트
 *
 * @param height 그림자의 높이
 * @param align 그라데이션 방향 (위에서 아래로 또는 아래에서 위로)
 */
export function DarkedLinearShadow({
  setPositionLayout = true,
  height,
  align = LinearAlign.topBottom,
}: {
  setPositionLayout?: boolean;
  height: number;
  align?: LinearAlign;
}) {
  // NOTE 연산 간소화 (변하는 값 X)
  const topBottomColors = [
    'rgba(0, 0, 0, 1)', // 위: 진하게
    'rgba(0, 0, 0, 0.9914)',
    'rgba(0, 0, 0, 0.9645)',
    'rgba(0, 0, 0, 0.9183)',
    'rgba(0, 0, 0, 0.8526)',
    'rgba(0, 0, 0, 0.7682)',
    'rgba(0, 0, 0, 0.6681)',
    'rgba(0, 0, 0, 0.5573)',
    'rgba(0, 0, 0, 0.4427)',
    'rgba(0, 0, 0, 0.3319)',
    'rgba(0, 0, 0, 0.2318)',
    'rgba(0, 0, 0, 0.1474)',
    'rgba(0, 0, 0, 0.0817)',
    'rgba(0, 0, 0, 0.0355)',
    'rgba(0, 0, 0, 0.0086)',
    'rgba(0, 0, 0, 0)', // 아래: 연하게
  ] as const;

  // TODO: 임시 빨간색 테스트
  const bottomTopColors = [
    'rgba(0, 0, 0, 0)', // 위: 연하게
    'rgba(0, 0, 0, 0.0086)',
    'rgba(0, 0, 0, 0.0355)',
    'rgba(0, 0, 0, 0.0817)',
    'rgba(0, 0, 0, 0.1474)',
    'rgba(0, 0, 0, 0.2318)',
    'rgba(0, 0, 0, 0.3319)',
    'rgba(0, 0, 0, 0.4427)',
    'rgba(0, 0, 0, 0.5573)',
    'rgba(0, 0, 0, 0.6681)',
    'rgba(0, 0, 0, 0.7682)',
    'rgba(0, 0, 0, 0.8526)',
    'rgba(0, 0, 0, 0.9183)',
    'rgba(0, 0, 0, 0.9645)',
    'rgba(0, 0, 0, 0.9914)',
    'rgba(0, 0, 0, 1)', // 아래: 진하게
  ] as const;

  const topBottomLocations = [
    0, 0.0086, 0.0355, 0.0817, 0.1474, 0.2318, 0.3319, 0.4427, 0.5573, 0.6681, 0.7682, 0.8526,
    0.9183, 0.9645, 0.9914, 1,
  ] as const;
  const bottomTopLocations = [
    0, 0.0086, 0.0355, 0.0817, 0.1474, 0.2318, 0.3319, 0.4427, 0.5573, 0.6681, 0.7682, 0.8526,
    0.9183, 0.9645, 0.9914, 1,
  ] as const;

  return (
    <LinearGradient
      colors={align === LinearAlign.bottomTop ? bottomTopColors : topBottomColors}
      locations={align === LinearAlign.bottomTop ? bottomTopLocations : topBottomLocations}
      style={{
        position: setPositionLayout ? 'absolute' : 'relative',
        top: align === LinearAlign.topBottom ? 0 : null,
        bottom: align === LinearAlign.bottomTop ? -1 : null, // 1px 틈 방지
        pointerEvents: 'none',
        left: 0,
        right: 0,
        height,
        alignItems: 'center',
      }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    />
  );
}

export enum LinearAlign {
  topBottom, // 위에서 진하게 → 아래로 연하게
  bottomTop, // 아래에서 진하게 → 위로 연하게
}
