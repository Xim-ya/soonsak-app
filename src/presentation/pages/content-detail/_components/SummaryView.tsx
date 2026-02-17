import React from 'react';
import styled from '@emotion/native';
import { ExpandableTextView } from '@/presentation/components/text/ExpandableTextView';
import textStyle from '@/shared/styles/textStyles';
import { useContentDetailRoute } from '../_hooks/useContentDetailRoute';
import { useContentDetail } from '@/features/tmdb/hooks/useContentDetail';

export const SummaryView = () => {
  const { id, type } = useContentDetailRoute();
  const { data: contentDetail, isLoading } = useContentDetail(id, type);

  // 로딩 중이 아니고 줄거리가 없거나 빈 문자열이면 렌더링하지 않음
  const hasOverview = contentDetail?.overview && contentDetail.overview.trim() !== '';
  if (!isLoading && !hasOverview) {
    return null;
  }

  return (
    <Container>
      <Title>줄거리</Title>
      <ContentWrapper>
        <ExpandableTextView
          text={contentDetail?.overview || ''}
          maxLines={3}
          isLoading={isLoading}
        />
      </ContentWrapper>
    </Container>
  );
};

/* Styled Components */
const Container = styled.View({
  width: '100%',
  paddingTop: 24,
  paddingHorizontal: 16,
  paddingBottom: 40,
});

const Title = styled.Text({
  ...textStyle.title2,
  marginBottom: 8,
});

const ContentWrapper = styled.View({});
