/**
 * PrimaryButton - 주요 액션 버튼
 *
 * 하단 CTA, 폼 제출 등 주요 액션에 사용하는 공통 버튼입니다.
 * 상태에 따라 활성/비활성/로딩 UI를 자동으로 표시합니다.
 *
 * @example
 * // 기본 사용법
 * <PrimaryButton title="저장" onPress={handleSubmit} />
 *
 * @example
 * // 비활성 상태
 * <PrimaryButton title="저장" onPress={handleSubmit} state="disabled" />
 *
 * @example
 * // 로딩 상태
 * <PrimaryButton title="저장" onPress={handleSubmit} state="loading" />
 *
 * @example
 * // 상태 동적 계산
 * <PrimaryButton
 *   title="저장"
 *   onPress={handleSubmit}
 *   state={isLoading ? 'loading' : isValid ? 'enabled' : 'disabled'}
 * />
 */

import { memo, useMemo } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';

/** 버튼 상태 */
type ButtonState = 'enabled' | 'disabled' | 'loading';

interface PrimaryButtonProps {
  /** 버튼 텍스트 */
  readonly title: string;
  /** 클릭 핸들러 */
  readonly onPress: () => void;
  /** 버튼 상태 (기본: enabled) */
  readonly state?: ButtonState;
}

/** 버튼 높이 */
const BUTTON_HEIGHT = 52;
/** 버튼 모서리 반경 */
const BUTTON_RADIUS = 12;
/** 로딩 인디케이터 크기 */
const INDICATOR_SIZE = 20;

function PrimaryButtonComponent({ title, onPress, state = 'enabled' }: PrimaryButtonProps) {
  const isEnabled = state === 'enabled';
  const isLoading = state === 'loading';
  const isDisabled = state === 'disabled' || isLoading;

  // 버튼 배경색 계산
  const backgroundColor = useMemo(() => {
    if (isEnabled) return colors.primary;
    return colors.gray04;
  }, [isEnabled]);

  return (
    <Button
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      backgroundColor={backgroundColor}
    >
      {isLoading ? (
        <ActivityIndicator size={INDICATOR_SIZE} color={colors.white} />
      ) : (
        <ButtonText>{title}</ButtonText>
      )}
    </Button>
  );
}

/* Styled Components */

const Button = styled(TouchableOpacity)<{ backgroundColor: string }>(({ backgroundColor }) => ({
  height: BUTTON_HEIGHT,
  borderRadius: BUTTON_RADIUS,
  backgroundColor,
  justifyContent: 'center',
  alignItems: 'center',
}));

const ButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
});

export const PrimaryButton = memo(PrimaryButtonComponent);
export type { PrimaryButtonProps, ButtonState };
