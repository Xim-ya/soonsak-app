/**
 * ChannelManagementItem - 채널 관리 아이템
 *
 * 채널 정보를 표시하고, 탭하면 채널 상세 페이지로 이동합니다.
 */

import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { ChannelManagementItem as ChannelManagementItemType } from '@/features/admin';
import { formatCompactNumber } from '@/features/admin';

const LOGO_SIZE = AppSize.ratioWidth(50);

// SVG 아이콘 상수 (컴포넌트 외부로 최적화)
const CHEVRON_RIGHT_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 18L15 12L9 6" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const DEFAULT_CHANNEL_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.54 6.42C22.4212 5.94541 22.1792 5.51057 21.8386 5.15941C21.498 4.80824 21.0707 4.55318 20.6 4.42C18.88 4 12 4 12 4C12 4 5.12 4 3.4 4.46C2.92925 4.59318 2.50198 4.84824 2.16135 5.19941C1.82072 5.55057 1.57879 5.98541 1.46 6.46C1.14521 8.20556 0.991228 9.97631 1 11.75C0.988687 13.537 1.14266 15.3213 1.46 17.08C1.59096 17.5398 1.83831 17.9581 2.17817 18.2945C2.51803 18.6308 2.93882 18.8738 3.4 19C5.12 19.46 12 19.46 12 19.46C12 19.46 18.88 19.46 20.6 19C21.0707 18.8668 21.498 18.6118 21.8386 18.2606C22.1792 17.9094 22.4212 17.4746 22.54 17C22.8524 15.2676 23.0063 13.5103 23 11.75C23.0113 9.96295 22.8573 8.1787 22.54 6.42Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.75 15.02L15.5 11.75L9.75 8.48V15.02Z" stroke="${colors.gray03}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface ChannelManagementItemProps {
  readonly channel: ChannelManagementItemType;
  readonly onPress: (channel: ChannelManagementItemType) => void;
}

export const ChannelManagementItem = memo(
  function ChannelManagementItem({ channel, onPress }: ChannelManagementItemProps) {
    const handlePress = useCallback(() => {
      onPress(channel);
    }, [channel, onPress]);

    // 메타 정보 문자열 메모이제이션
    const metaText = useMemo(() => {
      const videoText = `영상 ${formatCompactNumber(channel.videoCount)}개`;
      const contentText = `콘텐츠 ${formatCompactNumber(channel.contentCount)}개`;
      return `${videoText} · ${contentText}`;
    }, [channel.videoCount, channel.contentCount]);

    // 채널명 (없으면 기본값)
    const displayName = useMemo(() => channel.name || '이름 없음', [channel.name]);

    return (
      <Container onPress={handlePress} activeOpacity={0.7}>
        {/* 채널 로고 */}
        <LogoContainer>
          {channel.logoUrl ? (
            <LoadableImageView
              source={channel.logoUrl}
              width={LOGO_SIZE}
              height={LOGO_SIZE}
              borderRadius={LOGO_SIZE / 2}
            />
          ) : (
            <DefaultLogo>
              <SvgXml xml={DEFAULT_CHANNEL_SVG} width={24} height={24} />
            </DefaultLogo>
          )}
        </LogoContainer>

        <Gap size={12} />

        {/* 채널 정보 */}
        <InfoContainer>
          <ChannelName numberOfLines={1}>{displayName}</ChannelName>
          <Gap size={4} />
          <MetaText numberOfLines={1}>{metaText}</MetaText>
        </InfoContainer>

        {/* 화살표 */}
        <ChevronContainer>
          <SvgXml xml={CHEVRON_RIGHT_SVG} width={16} height={16} />
        </ChevronContainer>
      </Container>
    );
  },
  // props 비교 최적화: channel.id가 같으면 리렌더링 방지
  (prevProps, nextProps) => prevProps.channel.id === nextProps.channel.id,
);

/* Styled Components */
const Container = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: colors.black,
});

const LogoContainer = styled(View)({
  position: 'relative',
});

const DefaultLogo = styled(View)({
  width: LOGO_SIZE,
  height: LOGO_SIZE,
  borderRadius: LOGO_SIZE / 2,
  backgroundColor: colors.gray05,
  justifyContent: 'center',
  alignItems: 'center',
});

const InfoContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
});

const ChannelName = styled.Text({
  ...textStyles.body1,
  color: colors.white,
});

const MetaText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

const ChevronContainer = styled(View)({
  marginLeft: 8,
});
