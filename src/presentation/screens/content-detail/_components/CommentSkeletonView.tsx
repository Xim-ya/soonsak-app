import React from 'react';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import Gap from '@/presentation/components/view/Gap';

/**
 * CommentSkeletonView - 댓글 로딩 스켈레톤 컴포넌트
 *
 * CommentItemView (maxLines=2)와 동일한 높이를 유지합니다.
 * - HeaderRow: 18px (alert1 lineHeight)
 * - Gap: 4px
 * - CommentText 2줄: 40px (body3 lineHeight 20 × 2)
 * - Gap: 8px
 * - MetricsRow: 18px (alert2 lineHeight)
 * 총: 88px
 *
 * @example
 * <CommentSkeletonView />
 */

// CommentItemView 높이 상수
const HEADER_HEIGHT = 18; // alert1 lineHeight
const METRICS_HEIGHT = 18; // alert2 lineHeight

function CommentSkeletonView(): React.ReactElement {
  return (
    <Container>
      <AvatarSkeleton />
      <ContentContainer>
        {/* 닉네임 */}
        <HeaderRow>
          <HeaderSkeleton />
        </HeaderRow>
        <Gap size={4} />
        {/* 텍스트 2줄 */}
        <TextAreaContainer>
          <TextLineSkeleton style={{ width: '95%' }} />
          <TextLineSkeleton style={{ width: '60%' }} />
        </TextAreaContainer>
        <Gap size={8} />
        {/* 좋아요 */}
        <MetricsRow>
          <MetricsSkeleton />
        </MetricsRow>
      </ContentContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flexDirection: 'row',
});

const AvatarSkeleton = styled.View({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.gray05,
  marginRight: 12,
});

const ContentContainer = styled.View({
  flex: 1,
});

const HeaderRow = styled.View({
  height: HEADER_HEIGHT,
  justifyContent: 'center',
});

const HeaderSkeleton = styled.View({
  width: 120,
  height: 13,
  borderRadius: 4,
  backgroundColor: colors.gray05,
});

const TextAreaContainer = styled.View({
  gap: 6,
});

const TextLineSkeleton = styled.View({
  height: 14,
  borderRadius: 4,
  backgroundColor: colors.gray05,
});

const MetricsRow = styled.View({
  height: METRICS_HEIGHT,
  justifyContent: 'center',
});

const MetricsSkeleton = styled.View({
  width: 30,
  height: 13,
  borderRadius: 4,
  backgroundColor: colors.gray05,
});

export { CommentSkeletonView };
