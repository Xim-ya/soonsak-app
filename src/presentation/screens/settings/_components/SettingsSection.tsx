/**
 * SettingsSection - 설정 섹션 컨테이너
 *
 * 설정 항목들을 그룹화하는 섹션 컴포넌트입니다.
 * - 선택적 섹션 타이틀
 * - 카드 스타일 배경
 * - 자식 항목들 렌더링
 */

import { memo, ReactNode } from 'react';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';

interface SettingsSectionProps {
  /** 섹션 타이틀 (선택) */
  readonly title?: string;
  /** 자식 항목들 */
  readonly children: ReactNode;
}

function SettingsSectionComponent({ title, children }: SettingsSectionProps) {
  return (
    <Container>
      {title && <SectionTitle>{title}</SectionTitle>}
      <Card>{children}</Card>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  marginBottom: AppSize.ratioHeight(24),
});

const SectionTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: AppSize.ratioHeight(12),
  paddingHorizontal: AppSize.ratioWidth(16),
});

const Card = styled.View({
  backgroundColor: colors.gray06,
  borderRadius: 12,
  marginHorizontal: AppSize.ratioWidth(16),
  overflow: 'hidden',
});

export const SettingsSection = memo(SettingsSectionComponent);
