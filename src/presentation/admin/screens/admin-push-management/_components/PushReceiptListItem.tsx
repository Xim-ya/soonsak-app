/**
 * PushReceiptListItem - 푸시 발송 내역 리스트 아이템
 */

import { memo } from 'react';
import { View, Image } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { PushReceiptModel } from '../_types';

interface PushReceiptListItemProps {
  receipt: PushReceiptModel;
}

/** 발송 상태별 색상 */
const DELIVERY_STATUS_COLORS: Record<string, string> = {
  pending: colors.gray03,
  sent: colors.primary,
  delivered: colors.green,
  failed: colors.red,
  expired: colors.gray04,
};

/** 푸시 타입별 라벨 */
const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  new_content: '새 콘텐츠',
  new_video: '새 영상',
  content_update: '콘텐츠 업데이트',
  channel_update: '채널 업데이트',
  system: '시스템',
  marketing: '마케팅',
  reminder: '리마인더',
  recommendation: '추천',
};

/** 기본 아바타 URL */
const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=random&color=fff&name=U&size=40';

function PushReceiptListItemComponent({ receipt }: PushReceiptListItemProps) {
  const statusColor = DELIVERY_STATUS_COLORS[receipt.deliveryStatus] ?? colors.gray03;
  const typeLabel = NOTIFICATION_TYPE_LABELS[receipt.notificationType] ?? receipt.notificationType;

  return (
    <Container>
      {/* 유저 정보 */}
      <UserSection>
        <Avatar
          source={{ uri: receipt.userAvatarUrl ?? DEFAULT_AVATAR }}
          defaultSource={{ uri: DEFAULT_AVATAR }}
        />
        <UserInfo>
          <UserName numberOfLines={1}>
            {receipt.userDisplayName ?? '이름 없음'}
          </UserName>
          <UserEmail numberOfLines={1}>{receipt.userEmail ?? '-'}</UserEmail>
        </UserInfo>
      </UserSection>

      {/* 푸시 내용 */}
      <ContentSection>
        <ContentHeader>
          <TypeBadge>
            <TypeText>{typeLabel}</TypeText>
          </TypeBadge>
          <StatusBadge color={statusColor}>
            <StatusText>{receipt.deliveryStatusLabel}</StatusText>
          </StatusBadge>
          {receipt.isClicked && (
            <ClickBadge>
              <ClickText>클릭</ClickText>
            </ClickBadge>
          )}
        </ContentHeader>
        <PushTitle numberOfLines={1}>{receipt.title}</PushTitle>
        <PushBody numberOfLines={2}>{receipt.body}</PushBody>
      </ContentSection>

      {/* 시간 정보 */}
      <TimeSection>
        <TimeText>{receipt.createdAtFormatted}</TimeText>
      </TimeSection>
    </Container>
  );
}

export const PushReceiptListItem = memo(PushReceiptListItemComponent);

/* Styled Components */
const Container = styled.View({
  backgroundColor: colors.gray05,
  borderRadius: 12,
  padding: 12,
  marginHorizontal: 16,
  marginBottom: 8,
});

const UserSection = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
});

const Avatar = styled(Image)({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.gray04,
});

const UserInfo = styled.View({
  flex: 1,
  marginLeft: 10,
});

const UserName = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

const UserEmail = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginTop: 1,
});

const ContentSection = styled.View({
  borderTopWidth: 1,
  borderTopColor: colors.gray04,
  paddingTop: 10,
});

const ContentHeader = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
});

const TypeBadge = styled.View({
  backgroundColor: colors.gray04,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
});

const TypeText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
});

const StatusBadge = styled.View<{ color: string }>(({ color }) => ({
  backgroundColor: color,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
}));

const StatusText = styled.Text({
  ...textStyles.desc,
  color: colors.white,
  fontWeight: '500',
});

const ClickBadge = styled.View({
  backgroundColor: colors.red,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
});

const ClickText = styled.Text({
  ...textStyles.desc,
  color: colors.white,
});

const PushTitle = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '500',
  marginBottom: 2,
});

const PushBody = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  lineHeight: 18,
});

const TimeSection = styled.View({
  marginTop: 8,
  alignItems: 'flex-end',
});

const TimeText = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
});
