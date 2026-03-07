import textStyles from '@/presentation/styles/textStyles';
import styled from '@emotion/native';
import { View, Text, Platform } from 'react-native';

const DarkChip = ({ content }: { content: string }) => {
  return (
    <Container>
      <Content textBreakStrategy="simple">{content}</Content>
    </Container>
  );
};

/* Styled Components */
const Container = styled(View)({
  backgroundColor: 'rgba(40, 40, 49, 0.6)',
  paddingHorizontal: 6,
  paddingVertical: 4,
  borderRadius: 6,
  alignSelf: 'flex-start',
});

const Content = styled(Text)({
  ...textStyles.alert1,
  includeFontPadding: false,
  // Android letterSpacing + lineHeight 버그 우회
  ...(Platform.OS === 'android' && { lineHeight: undefined }),
});

export default DarkChip;
