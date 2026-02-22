import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import styled from '@emotion/native';
import { TouchableOpacity } from 'react-native';

const DarkChip = ({ content }: { content: string }) => {
  return (
    <Container>
      <Content numberOfLines={1}>{content}</Content>
    </Container>
  );
};

/* Styled Components */
const Container = styled(TouchableOpacity)({
  backgroundColor: 'rgba(40, 40, 49, 0.6)', // #282831 60% 투명도
  paddingHorizontal: 6,
  paddingVertical: 4,
  borderRadius: 6,
  alignSelf: 'flex-start',
  flexShrink: 0, // 부모 레이아웃에 의해 줄어들지 않도록
});

const Content = styled.Text({
  ...textStyles.alert1,
});

export default DarkChip;
