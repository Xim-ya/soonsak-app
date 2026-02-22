/**
 * UserStatisticsCards - 유저 통계 카드
 *
 * 총 유저, 일일 방문자, 활성 푸시 토큰 수를 표시합니다.
 */

import { memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import type { UserStatistics } from '@/features/admin';

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
      <Card>
        <CardValue>{formatNumber(statistics.totalUsers)}</CardValue>
        <CardLabel>총 가입자</CardLabel>
      </Card>
      <Card>
        <CardValue>{formatNumber(statistics.dailyActiveVisitors)}</CardValue>
        <CardLabel>오늘 방문자</CardLabel>
      </Card>
      <Card>
        <CardValue>{formatNumber(statistics.activePushTokens)}</CardValue>
        <CardLabel>활성 푸시</CardLabel>
      </Card>
    </Container>
  );
});

/**
 * 숫자 포맷팅 (1000 → 1K, 1000000 → 1M)
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/* Styled Components */
const Container = styled(View)({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 12,
});

const LoadingContainer = styled(View)({
  flex: 1,
  height: AppSize.ratioHeight(70),
  justifyContent: 'center',
  alignItems: 'center',
});

const Card = styled(View)({
  flex: 1,
  backgroundColor: colors.gray06,
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 12,
  alignItems: 'center',
});

const CardValue = styled.Text({
  ...textStyles.title1,
  color: colors.white,
  marginBottom: 4,
});

const CardLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});
