/**
 * PushTokenStatus - 푸시 토큰 상태
 *
 * 유저의 푸시 토큰 목록과 상태를 표시합니다.
 */

import { memo, useMemo } from 'react';
import { View } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { PushTokenInfo } from '@/features/admin';

// 알림 아이콘 SVG
const bellIconSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface PushTokenStatusProps {
  readonly tokens: PushTokenInfo[];
}

export const PushTokenStatus = memo(function PushTokenStatus({ tokens }: PushTokenStatusProps) {
  // 토큰 분류 (활성/비활성)
  const { activeTokens, inactiveTokens } = useMemo(() => {
    const active = tokens.filter((token) => token.isActive);
    const inactive = tokens.filter((token) => !token.isActive);
    return { activeTokens: active, inactiveTokens: inactive };
  }, [tokens]);

  // 토큰이 비어있는지 여부
  const hasNoTokens = tokens.length === 0;
  const hasActiveTokens = activeTokens.length > 0;
  const hasInactiveTokens = inactiveTokens.length > 0;

  return (
    <Container>
      <SectionHeader>
        <SvgXml xml={bellIconSvg} width={24} height={24} />
        <SectionTitle>푸시 토큰</SectionTitle>
      </SectionHeader>

      {hasNoTokens ? (
        <EmptyContainer>
          <EmptyText>등록된 푸시 토큰이 없습니다</EmptyText>
        </EmptyContainer>
      ) : (
        <>
          {/* 활성 토큰 */}
          {hasActiveTokens && (
            <TokenSection>
              <TokenSectionTitle>활성 ({activeTokens.length})</TokenSectionTitle>
              {activeTokens.map((token) => (
                <TokenItem key={token.id}>
                  <TokenPlatform>{token.platform.toUpperCase()}</TokenPlatform>
                  <TokenValue numberOfLines={1} ellipsizeMode="middle">
                    {token.token}
                  </TokenValue>
                  <StatusDot isActive />
                </TokenItem>
              ))}
            </TokenSection>
          )}

          {/* 비활성 토큰 */}
          {hasInactiveTokens && (
            <TokenSection>
              <TokenSectionTitle>비활성 ({inactiveTokens.length})</TokenSectionTitle>
              {inactiveTokens.map((token) => (
                <TokenItem key={token.id}>
                  <TokenPlatform>{token.platform.toUpperCase()}</TokenPlatform>
                  <TokenValue numberOfLines={1} ellipsizeMode="middle">
                    {token.token}
                  </TokenValue>
                  <StatusDot isActive={false} />
                </TokenItem>
              ))}
            </TokenSection>
          )}
        </>
      )}
    </Container>
  );
});

/* Styled Components */
const Container = styled(View)({
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: colors.black,
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
});

const SectionHeader = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
});

const SectionTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
});

const EmptyContainer = styled(View)({
  paddingVertical: 20,
  alignItems: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
});

const TokenSection = styled(View)({
  marginBottom: 12,
});

const TokenSectionTitle = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  marginBottom: 8,
});

const TokenItem = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray06,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 8,
  marginBottom: 6,
  gap: 8,
});

const TokenPlatform = styled.Text({
  ...textStyles.alert2,
  color: colors.gray01,
  fontWeight: '600',
  width: 45,
});

const TokenValue = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  flex: 1,
});

interface StatusDotProps {
  isActive: boolean;
}

const StatusDot = styled(View)<StatusDotProps>(({ isActive }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: isActive ? colors.green : colors.gray04,
}));
