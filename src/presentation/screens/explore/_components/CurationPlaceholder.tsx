/**
 * CurationPlaceholder - 큐레이션 영역 플레이스홀더
 *
 * 추후 개발 예정인 큐레이션 영역을 표시합니다.
 */

import React from 'react';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

function CurationPlaceholder(): React.ReactElement {
  return (
    <Container>
      <PlaceholderText>큐레이션 영역</PlaceholderText>
    </Container>
  );
}

const Container = styled.View({
  height: 200,
  backgroundColor: colors.gray06,
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 16,
  marginBottom: 16,
  borderRadius: 12,
});

const PlaceholderText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
});

export { CurationPlaceholder };
