/**
 * FilterFooter - 필터 하단 초기화/적용 버튼 컴포넌트
 *
 * 바텀시트 하단에 고정되며, 필터 초기화와 적용 버튼을 제공합니다.
 * SafeArea 하단 여백을 자동으로 처리합니다.
 *
 * @example
 * <FilterFooter
 *   onReset={() => setFilter(DEFAULT_CONTENT_FILTER)}
 *   onApply={() => applyFilter(tempFilter)}
 * />
 */

import React from 'react';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import textStyles from '@/shared/styles/textStyles';
import colors from '@/shared/styles/colors';

interface FilterFooterProps {
  /** 초기화 버튼 콜백 */
  readonly onReset: () => void;
  /** 적용하기 버튼 콜백 */
  readonly onApply: () => void;
}

function FilterFooter({ onReset, onApply }: FilterFooterProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <Container bottomInset={insets.bottom}>
      <Divider />
      <ButtonRow>
        <ResetButton onPress={onReset} activeOpacity={0.7}>
          <ResetIcon>↻</ResetIcon>
          <ResetText>초기화</ResetText>
        </ResetButton>
        <ApplyButton onPress={onApply} activeOpacity={0.8}>
          <ApplyText>적용하기</ApplyText>
        </ApplyButton>
      </ButtonRow>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View<{ bottomInset: number }>(({ bottomInset }) => ({
  paddingBottom: Math.max(bottomInset, 8) + 8,
  backgroundColor: colors.gray06,
}));

const Divider = styled.View({
  height: 1,
  backgroundColor: colors.gray04,
});

const ButtonRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 12,
  gap: 12,
});

const ResetButton = styled.TouchableOpacity({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 14,
  paddingHorizontal: 8,
  gap: 4,
});

const ResetIcon = styled.Text({
  ...textStyles.body1,
  color: colors.gray01,
});

const ResetText = styled.Text({
  ...textStyles.body1,
  color: colors.gray01,
});

const ApplyButton = styled.TouchableOpacity({
  flex: 1,
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingVertical: 14,
  alignItems: 'center',
});

const ApplyText = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

export { FilterFooter };
export type { FilterFooterProps };
