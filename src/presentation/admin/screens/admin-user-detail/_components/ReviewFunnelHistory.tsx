/**
 * ReviewFunnelHistory - 리뷰 퍼널 발송 기록
 *
 * 유저에게 보낸 앱 리뷰 적극 유도 푸시 기록과 세션 상태를 표시합니다.
 */

import { memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { adminUserApi } from '@/features/admin/api/adminUserApi';

// 별 아이콘 SVG
const starIconSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="${colors.yellow}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface ReviewFunnelHistoryProps {
  readonly userId: string;
}

export const ReviewFunnelHistory = memo(function ReviewFunnelHistory({
  userId,
}: ReviewFunnelHistoryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewFunnelHistory', userId],
    queryFn: () => adminUserApi.getReviewFunnelHistory(userId),
    staleTime: 1000 * 60, // 1분
  });

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 세션 상태 텍스트
  const getSessionStatusText = () => {
    if (!data?.session) return null;

    const { hasReviewed, reviewType } = data.session;

    if (hasReviewed === null) {
      return { text: '미오픈', color: colors.gray03 };
    }
    if (hasReviewed === false) {
      return { text: '진입함 (미완료)', color: colors.yellow };
    }
    if (hasReviewed === true) {
      const typeText = reviewType === 'write_review' ? '리뷰 작성' : '평점만';
      return { text: `완료 (${typeText})`, color: colors.green };
    }
    return null;
  };

  const sessionStatus = getSessionStatusText();

  return (
    <Container>
      <SectionHeader>
        <SvgXml xml={starIconSvg} width={24} height={24} />
        <SectionTitle>리뷰 퍼널 기록</SectionTitle>
      </SectionHeader>

      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="small" color={colors.gray02} />
        </LoadingContainer>
      ) : error ? (
        <EmptyContainer>
          <EmptyText>기록을 불러오지 못했어요</EmptyText>
        </EmptyContainer>
      ) : (
        <>
          {/* 세션 상태 */}
          {data?.session && sessionStatus && (
            <SessionCard>
              <SessionLabel>퍼널 상태</SessionLabel>
              <SessionStatusRow>
                <StatusDot statusColor={sessionStatus.color} />
                <SessionStatusText statusColor={sessionStatus.color}>
                  {sessionStatus.text}
                </SessionStatusText>
              </SessionStatusRow>
              <SessionDate>생성: {formatDate(data.session.createdAt)}</SessionDate>
              {data.session.hasReviewed !== null && (
                <SessionDate>업데이트: {formatDate(data.session.updatedAt)}</SessionDate>
              )}
            </SessionCard>
          )}

          {/* 발송 기록 */}
          <NotificationSection>
            <NotificationSectionTitle>
              발송 기록 ({data?.notifications.length ?? 0})
            </NotificationSectionTitle>

            {(data?.notifications.length ?? 0) === 0 ? (
              <EmptyNotification>
                <EmptyNotificationText>발송 기록이 없어요</EmptyNotificationText>
              </EmptyNotification>
            ) : (
              data?.notifications.map((notification) => (
                <NotificationItem key={notification.id}>
                  <NotificationContent>
                    <NotificationTitle numberOfLines={1}>{notification.title}</NotificationTitle>
                    <NotificationBody numberOfLines={2}>{notification.body}</NotificationBody>
                  </NotificationContent>
                  <NotificationDate>{formatDate(notification.createdAt)}</NotificationDate>
                </NotificationItem>
              ))
            )}
          </NotificationSection>
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

const LoadingContainer = styled(View)({
  paddingVertical: 20,
  alignItems: 'center',
});

const EmptyContainer = styled(View)({
  paddingVertical: 20,
  alignItems: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
});

const SessionCard = styled(View)({
  backgroundColor: colors.gray06,
  borderRadius: 10,
  padding: 14,
  marginBottom: 16,
});

const SessionLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginBottom: 8,
});

const SessionStatusRow = styled(View)({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
});

interface StatusDotProps {
  statusColor: string;
}

const StatusDot = styled(View)<StatusDotProps>(({ statusColor }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: statusColor,
}));

const SessionStatusText = styled.Text<StatusDotProps>(({ statusColor }) => ({
  ...textStyles.body1,
  color: statusColor,
  fontWeight: '600',
}));

const SessionDate = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginTop: 4,
});

const NotificationSection = styled(View)({
  marginTop: 4,
});

const NotificationSectionTitle = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  marginBottom: 10,
});

const EmptyNotification = styled(View)({
  paddingVertical: 16,
  alignItems: 'center',
  backgroundColor: colors.gray06,
  borderRadius: 8,
});

const EmptyNotificationText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});

const NotificationItem = styled(View)({
  backgroundColor: colors.gray06,
  borderRadius: 8,
  padding: 12,
  marginBottom: 8,
});

const NotificationContent = styled(View)({
  marginBottom: 8,
});

const NotificationTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
  marginBottom: 4,
});

const NotificationBody = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});

const NotificationDate = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
});
