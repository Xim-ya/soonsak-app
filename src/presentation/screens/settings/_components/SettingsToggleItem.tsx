/**
 * SettingsToggleItem - 토글 스위치가 있는 설정 항목
 *
 * 켜기/끄기가 가능한 설정 항목입니다.
 * - 라벨 텍스트
 * - 선택적 설명 텍스트
 * - 토글 스위치
 */

import { memo } from 'react';
import { Switch } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';

interface SettingsToggleItemProps {
  /** 항목 라벨 */
  readonly label: string;
  /** 하위 설명 텍스트 (선택) */
  readonly description?: string;
  /** 토글 상태 */
  readonly value: boolean;
  /** 토글 변경 핸들러 */
  readonly onValueChange: (value: boolean) => void;
  /** 비활성화 여부 */
  readonly disabled?: boolean;
}

function SettingsToggleItemComponent({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: SettingsToggleItemProps) {
  return (
    <Container>
      <LeftContent>
        <Label>{label}</Label>
        {description && <Description>{description}</Description>}
      </LeftContent>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.gray04, true: colors.primary }}
        thumbColor={colors.white}
      />
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: AppSize.ratioHeight(16),
  paddingHorizontal: AppSize.ratioWidth(16),
  minHeight: AppSize.ratioHeight(56),
});

const LeftContent = styled.View({
  flex: 1,
  marginRight: AppSize.ratioWidth(12),
});

const Label = styled.Text({
  ...textStyles.body1,
  color: colors.white,
});

const Description = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: AppSize.ratioHeight(4),
});

export const SettingsToggleItem = memo(SettingsToggleItemComponent);
