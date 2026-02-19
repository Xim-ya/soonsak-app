/**
 * ChannelPage - 채널 탭 화면
 *
 * 다양한 채널을 탐색하고 구독할 수 있는 화면입니다.
 * 기존 빠른탐색에서 채널 섹션으로 분리되었습니다.
 */

import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { BasePage } from '@/presentation/components/page/BasePage';

export default function ChannelPage() {
  const insets = useSafeAreaInsets();

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <Container style={{ paddingTop: insets.top }}>
        <HeaderSection>
          <TitleText>채널</TitleText>
        </HeaderSection>
        <ContentSection>
          <PlaceholderText>채널 콘텐츠가 여기에 표시됩니다</PlaceholderText>
        </ContentSection>
      </Container>
    </BasePage>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const HeaderSection = styled.View({
  paddingHorizontal: 16,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

const TitleText = styled.Text({
  ...textStyles.headline1,
  color: colors.white,
});

const ContentSection = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const PlaceholderText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
});
