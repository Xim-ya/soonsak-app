import { ContentType, contentTypeConfigs } from '@/shared/types/content/contentType.enum';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import styled from '@emotion/native';

function ContentTypeChip({ contentType }: { contentType: ContentType }) {
  // contentType이 undefined이거나 configs에 없는 경우 'unknown' 사용
  const safeContentType = contentType && contentTypeConfigs[contentType] ? contentType : 'unknown';

  return (
    <ChipContainer>
      <ChipText>{contentTypeConfigs[safeContentType].label}</ChipText>
    </ChipContainer>
  );
}

const ChipContainer = styled.View({
  backgroundColor: colors.white,
  paddingHorizontal: 5,
  paddingVertical: 2,
  borderRadius: 4,
});

const ChipText = styled.Text({
  ...textStyles.nav,
  color: colors.black,
});

export default ContentTypeChip;
