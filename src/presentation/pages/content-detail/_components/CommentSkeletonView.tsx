import React from 'react';
import styled from '@emotion/native';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import Gap from '@/presentation/components/view/Gap';

/**
 * CommentSkeletonView - 댓글 로딩 스켈레톤 컴포넌트
 *
 * 댓글 데이터 로딩 중 표시되는 스켈레톤 UI입니다.
 * 프로필 이미지, 작성자명, 댓글 내용 영역의 플레이스홀더를 표시합니다.
 *
 * @example
 * // 단일 스켈레톤
 * <CommentSkeletonView />
 *
 * // 여러 개의 스켈레톤 (로딩 리스트)
 * <>
 *   <CommentSkeletonView />
 *   <Gap size={16} />
 *   <CommentSkeletonView />
 * </>
 */
function CommentSkeletonView(): React.ReactElement {
  return (
    <Container>
      <AvatarContainer>
        <SkeletonView width={36} height={36} borderRadius={18} />
      </AvatarContainer>
      <ContentContainer>
        <SkeletonView width={100} height={18} borderRadius={4} />
        <Gap size={8} />
        <SkeletonView width={280} height={20} borderRadius={4} />
        <Gap size={4} />
        <SkeletonView width={220} height={20} borderRadius={4} />
      </ContentContainer>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flexDirection: 'row',
});

const AvatarContainer = styled.View({
  marginRight: 12,
});

const ContentContainer = styled.View({
  flex: 1,
});

export { CommentSkeletonView };
