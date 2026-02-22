/**
 * UserStatisticsCards - 유저 통계 카드
 *
 * 총 DAU (회원/비회원 breakdown), 총 가입자, 오늘 가입자를 표시합니다.
 */

import { memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { UserStatistics } from '@/features/admin';
import { formatCompactNumber } from '@/features/admin';

interface UserStatisticsCardsProps {
  readonly statistics: UserStatistics;
  readonly isLoading: boolean;
}

export const UserStatisticsCards = memo(function UserStatisticsCards({
  statistics,
  isLoading,
}: UserStatisticsCardsProps) {
  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <ActivityIndicator size="small" color={colors.gray02} />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {/* 오늘 DAU - 메인 카드 */}
      <DauCard>
        <DauHeader>
          <DauLabel>오늘 DAU</DauLabel>
          <DauValue>{formatCompactNumber(statistics.totalDau)}</DauValue>
        </DauHeader>
        <DauBreakdown>
          <BreakdownItem>
            <BreakdownDot color={colors.primary} />
            <BreakdownLabel>회원</BreakdownLabel>
            <BreakdownValue>{formatCompactNumber(statistics.memberDau)}</BreakdownValue>
          </BreakdownItem>
          <BreakdownDivider />
          <BreakdownItem>
            <BreakdownDot color={colors.gray03} />
            <BreakdownLabel>비회원</BreakdownLabel>
            <BreakdownValue>{formatCompactNumber(statistics.nonMemberDau)}</BreakdownValue>
          </BreakdownItem>
        </DauBreakdown>
      </DauCard>

      {/* 하단 미니 카드들 */}
      <MiniCardsRow>
        <MiniCard>
          <MiniCardValue>{formatCompactNumber(statistics.totalUsers)}</MiniCardValue>
          <MiniCardLabel>총 가입자</MiniCardLabel>
        </MiniCard>
        <MiniCard>
          <MiniCardValue>{formatCompactNumber(statistics.newUsersToday)}</MiniCardValue>
          <MiniCardLabel>오늘 가입</MiniCardLabel>
        </MiniCard>
      </MiniCardsRow>
    </Container>
  );
});

/* Styled Components */
const Container = styled(View)({
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 16,
  gap: 12,
});

const LoadingContainer = styled(View)({
  height: 120,
  justifyContent: 'center',
  alignItems: 'center',
});

const DauCard = styled(View)({
  backgroundColor: colors.gray06,
  borderRadius: 12,
  padding: 16,
});

const DauHeader = styled(View)({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
});

const DauLabel = styled.Text({
  ...textStyles.body1,
  color: colors.gray02,
});

const DauValue = styled.Text({
  ...textStyles.headline2,
  color: colors.white,
});

const DauBreakdown = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
});

const BreakdownItem = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
});

const BreakdownDot = styled(View)<{ color: string }>(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: color,
}));

const BreakdownLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
});

const BreakdownValue = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

const BreakdownDivider = styled(View)({
  width: 1,
  height: 12,
  backgroundColor: colors.gray05,
  marginHorizontal: 16,
});

const MiniCardsRow = styled(View)({
  flexDirection: 'row',
  gap: 12,
});

const MiniCard = styled(View)({
  flex: 1,
  backgroundColor: colors.gray06,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 12,
  alignItems: 'center',
});

const MiniCardValue = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 2,
});

const MiniCardLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});
