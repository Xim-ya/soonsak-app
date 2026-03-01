/**
 * SettingsItem - 설정 항목 컴포넌트
 *
 * 설정 화면의 개별 항목을 표시합니다.
 * - 라벨 텍스트
 * - 선택적 설명 텍스트
 * - 우측 화살표 또는 커스텀 요소
 * - 터치 피드백
 */

import { memo, ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import RightArrowIcon from '@assets/icons/right_arrrow.svg';

interface SettingsItemProps {
  /** 항목 라벨 */
  readonly label: string;
  /** 하위 설명 텍스트 (선택) */
  readonly description?: string;
  /** 우측에 표시될 커스텀 요소 (기본: 화살표 아이콘) */
  readonly rightElement?: ReactNode;
  /** 화살표 표시 여부 (rightElement가 없을 때 적용) */
  readonly showArrow?: boolean;
  /** 클릭 핸들러 */
  readonly onPress?: () => void;
  /** 텍스트 색상 (기본: white) */
  readonly labelColor?: string;
  /** 비활성화 여부 */
  readonly disabled?: boolean;
}

const ICON_SIZE = 16;

function SettingsItemComponent({
  label,
  description,
  rightElement,
  showArrow = true,
  onPress,
  labelColor = colors.white,
  disabled = false,
}: SettingsItemProps) {
  const content = (
    <Container>
      <LeftContent>
        <Label labelColor={labelColor}>{label}</Label>
        {description && <Description>{description}</Description>}
      </LeftContent>
      <RightContent>
        {rightElement ||
          (showArrow && (
            <RightArrowIcon width={ICON_SIZE} height={ICON_SIZE} color={colors.gray02} />
          ))}
      </RightContent>
    </Container>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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

const Label = styled.Text<{ labelColor: string }>(({ labelColor }) => ({
  ...textStyles.body1,
  color: labelColor,
}));

const Description = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: AppSize.ratioHeight(4),
});

const RightContent = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

export const SettingsItem = memo(SettingsItemComponent);
