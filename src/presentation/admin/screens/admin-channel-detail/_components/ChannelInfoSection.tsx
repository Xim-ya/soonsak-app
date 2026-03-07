/**
 * ChannelInfoSection - 채널 정보 섹션 컴포넌트
 *
 * 채널 로고, 채널명, 구독자 수, 영상/콘텐츠 수, 등록일을 표시합니다.
 */

import { View } from 'react-native';
import styled from '@emotion/native';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { formatDate, formatCompactNumber } from '@/features/admin';
import type { ChannelDetailItem } from '@/features/admin/api/adminChannelApi';

// ============================================================================
// Constants
// ============================================================================

const LOGO_SIZE = 80;

// ============================================================================
// Types
// ============================================================================

interface ChannelInfoSectionProps {
  readonly channel: ChannelDetailItem;
}

// ============================================================================
// Component
// ============================================================================

export function ChannelInfoSection({ channel }: ChannelInfoSectionProps) {
  const subscriberText = channel.subscriberCount
    ? `구독자 ${formatCompactNumber(channel.subscriberCount)}명`
    : null;

  return (
    <Container>
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
          <PlaceholderLogo>
            <PlaceholderText>{channel.name.charAt(0).toUpperCase()}</PlaceholderText>
          </PlaceholderLogo>
        )}
      </LogoContainer>

      {/* 채널 정보 */}
      <InfoContainer>
        <ChannelName numberOfLines={2}>{channel.name}</ChannelName>

        {subscriberText && <SubscriberCount>{subscriberText}</SubscriberCount>}

        <StatsRow>
          <StatItem>
            <StatLabel>영상</StatLabel>
            <StatValue>{channel.videoCount}개</StatValue>
          </StatItem>
          <StatDivider />
          <StatItem>
            <StatLabel>콘텐츠</StatLabel>
            <StatValue>{channel.contentCount}개</StatValue>
          </StatItem>
        </StatsRow>

        <RegisteredDate>등록일: {formatDate(channel.createdAt)}</RegisteredDate>
      </InfoContainer>
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(View)({
  flexDirection: 'row',
  padding: 16,
  backgroundColor: colors.gray06,
  borderRadius: 12,
  marginHorizontal: 16,
  marginTop: 16,
  gap: 16,
});

const LogoContainer = styled(View)({
  width: LOGO_SIZE,
  height: LOGO_SIZE,
});

const PlaceholderLogo = styled(View)({
  width: LOGO_SIZE,
  height: LOGO_SIZE,
  borderRadius: LOGO_SIZE / 2,
  backgroundColor: colors.gray04,
  justifyContent: 'center',
  alignItems: 'center',
});

const PlaceholderText = styled.Text({
  ...textStyles.headline1,
  color: colors.gray02,
});

const InfoContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
});

const ChannelName = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 4,
});

const SubscriberCount = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  marginBottom: 8,
});

const StatsRow = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
});

const StatItem = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
});

const StatLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

const StatValue = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});

const StatDivider = styled(View)({
  width: 1,
  height: 12,
  backgroundColor: colors.gray04,
  marginHorizontal: 12,
});

const RegisteredDate = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
});
