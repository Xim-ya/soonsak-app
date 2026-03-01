/**
 * PushStatisticsCards - 푸시 통계 카드
 */

import { View, ActivityIndicator } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { PushStatisticsModel } from '../_types';

interface PushStatisticsCardsProps {
  statistics: PushStatisticsModel | undefined;
  isLoading: boolean;
}

export function PushStatisticsCards({ statistics, isLoading }: PushStatisticsCardsProps) {
  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <ActivityIndicator size="small" color={colors.gray02} />
        </LoadingContainer>
      </Container>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Container>
      <Row>
        <StatCard>
          <StatValue>{statistics.totalTemplates}</StatValue>
          <StatLabel>전체 템플릿</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{statistics.activeTemplates}</StatValue>
          <StatLabel>활성 템플릿</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{statistics.scheduledTemplates}</StatValue>
          <StatLabel>예약됨</StatLabel>
        </StatCard>
      </Row>
      <Row>
        <StatCard>
          <StatValue>{statistics.sentToday}</StatValue>
          <StatLabel>오늘 발송</StatLabel>
        </StatCard>
        <StatCard flex={2}>
          <StatValue>{statistics.activePushTokens}</StatValue>
          <StatLabel>활성 푸시 토큰</StatLabel>
        </StatCard>
      </Row>
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 8,
  gap: 8,
});

const LoadingContainer = styled.View({
  height: 120,
  justifyContent: 'center',
  alignItems: 'center',
});

const Row = styled.View({
  flexDirection: 'row',
  gap: 8,
});

const StatCard = styled.View<{ flex?: number }>(({ flex = 1 }) => ({
  flex,
  backgroundColor: colors.gray05,
  borderRadius: 12,
  padding: 12,
  alignItems: 'center',
}));

const StatValue = styled.Text({
  ...textStyles.headline1,
  color: colors.white,
});

const StatLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginTop: 2,
});
