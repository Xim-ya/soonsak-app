/**
 * PushTemplateItem - 푸시 템플릿 목록 아이템
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity, Switch } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { PushTemplateModel } from '../_types';

interface PushTemplateItemProps {
  template: PushTemplateModel;
  onToggleActive: (templateId: string, currentActive: boolean) => void;
  onCancelSchedule: (templateId: string, templateName: string) => void;
  onDelete: (templateId: string, templateName: string) => void;
}

/** 스케줄 상태별 배지 색상 */
const STATUS_COLORS: Record<string, string> = {
  draft: colors.gray03,
  scheduled: colors.primary,
  processing: colors.yellow,
  sent: colors.green,
  cancelled: colors.gray04,
  failed: colors.red,
};

function PushTemplateItemComponent({
  template,
  onToggleActive,
  onCancelSchedule,
  onDelete,
}: PushTemplateItemProps) {
  const handleToggleActive = useCallback(() => {
    onToggleActive(template.id, template.isActive);
  }, [onToggleActive, template.id, template.isActive]);

  const handleCancelSchedule = useCallback(() => {
    onCancelSchedule(template.id, template.name);
  }, [onCancelSchedule, template.id, template.name]);

  const handleDelete = useCallback(() => {
    onDelete(template.id, template.name);
  }, [onDelete, template.id, template.name]);

  const statusColor = STATUS_COLORS[template.scheduleStatus] ?? colors.gray03;
  const canCancel = template.scheduleStatus === 'scheduled';

  return (
    <Container>
      <Header>
        <TitleRow>
          <TemplateName numberOfLines={1}>{template.name}</TemplateName>
          <StatusBadge color={statusColor}>
            <StatusText>{template.scheduleStatusLabel}</StatusText>
          </StatusBadge>
        </TitleRow>
        <ActiveSwitch>
          <Switch
            value={template.isActive}
            onValueChange={handleToggleActive}
            trackColor={{ false: colors.gray04, true: colors.primary }}
            thumbColor={colors.white}
          />
        </ActiveSwitch>
      </Header>

      <ContentPreview>
        <PreviewLabel>제목</PreviewLabel>
        <PreviewText numberOfLines={1}>{template.titleTemplate}</PreviewText>
      </ContentPreview>

      <ContentPreview>
        <PreviewLabel>내용</PreviewLabel>
        <PreviewText numberOfLines={2}>{template.bodyTemplate}</PreviewText>
      </ContentPreview>

      {template.bodyVariants.length > 0 && (
        <VariantsInfo>
          <VariantsText>+{template.bodyVariants.length}개 변형 메시지</VariantsText>
        </VariantsInfo>
      )}

      <InfoRow>
        <InfoItem>
          <InfoLabel>타겟</InfoLabel>
          <InfoValue>{template.targetType}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>반복</InfoLabel>
          <InfoValue>
            {template.recurrenceType === 'none' ? '1회' : template.recurrenceType}
          </InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>우선순위</InfoLabel>
          <InfoValue>{template.priority}</InfoValue>
        </InfoItem>
      </InfoRow>

      {template.nextRunAtFormatted && (
        <ScheduleInfo>
          <ScheduleLabel>다음 발송</ScheduleLabel>
          <ScheduleValue>{template.nextRunAtFormatted}</ScheduleValue>
        </ScheduleInfo>
      )}

      {template.lastRunAtFormatted && (
        <ScheduleInfo>
          <ScheduleLabel>마지막 발송</ScheduleLabel>
          <ScheduleValue>{template.lastRunAtFormatted}</ScheduleValue>
        </ScheduleInfo>
      )}

      <ActionRow>
        {canCancel && (
          <ActionButton onPress={handleCancelSchedule}>
            <ActionButtonText color={colors.yellow}>스케줄 취소</ActionButtonText>
          </ActionButton>
        )}
        <ActionButton onPress={handleDelete}>
          <ActionButtonText color={colors.red}>삭제</ActionButtonText>
        </ActionButton>
      </ActionRow>
    </Container>
  );
}

export const PushTemplateItem = memo(PushTemplateItemComponent);

/* Styled Components */
const Container = styled.View({
  backgroundColor: colors.gray05,
  borderRadius: 12,
  padding: 16,
  marginHorizontal: 16,
  marginBottom: 12,
});

const Header = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 12,
});

const TitleRow = styled.View({
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginRight: 8,
});

const TemplateName = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  fontWeight: '600',
  flex: 1,
});

const StatusBadge = styled.View<{ color: string }>(({ color }) => ({
  backgroundColor: color,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
}));

const StatusText = styled.Text({
  ...textStyles.desc,
  color: colors.white,
  fontWeight: '500',
});

const ActiveSwitch = styled.View({});

const ContentPreview = styled.View({
  marginBottom: 8,
});

const PreviewLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginBottom: 2,
});

const PreviewText = styled.Text({
  ...textStyles.body2,
  color: colors.gray01,
});

const VariantsInfo = styled.View({
  marginBottom: 8,
});

const VariantsText = styled.Text({
  ...textStyles.alert2,
  color: colors.primary,
});

const InfoRow = styled.View({
  flexDirection: 'row',
  gap: 16,
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: colors.gray04,
});

const InfoItem = styled.View({});

const InfoLabel = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
});

const InfoValue = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginTop: 2,
});

const ScheduleInfo = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 8,
});

const ScheduleLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginRight: 8,
});

const ScheduleValue = styled.Text({
  ...textStyles.alert2,
  color: colors.primary,
  fontWeight: '500',
});

const ActionRow = styled.View({
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 1,
  borderTopColor: colors.gray04,
});

const ActionButton = styled(TouchableOpacity)({
  paddingVertical: 4,
  paddingHorizontal: 8,
});

const ActionButtonText = styled.Text<{ color: string }>(({ color }) => ({
  ...textStyles.alert1,
  color,
}));
