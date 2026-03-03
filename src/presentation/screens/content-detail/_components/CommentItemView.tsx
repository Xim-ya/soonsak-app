import React, { memo } from 'react';
import styled from '@emotion/native';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { CommentModel } from '../_types/commentModel.cd';
import ThumbFilledIcon from '@assets/icons/thumb_filled.svg';

interface CommentItemViewProps {
  /** 댓글 데이터 */
  readonly comment: CommentModel;
  /** 댓글 내용 최대 줄 수 (기본값: 무제한) */
  readonly maxLines?: number;
  /** 답글 수 표시 여부 (기본값: true) */
  readonly showReplyCount?: boolean;
  /** 고정 댓글 배지 표시 여부 (기본값: true) */
  readonly showPinnedBadge?: boolean;
}

/**
 * CommentItemView - 댓글 아이템 컴포넌트
 *
 * YouTube 스타일의 댓글 아이템을 렌더링합니다.
 * 프로필 이미지, 작성자명, 작성 시간, 댓글 내용, 좋아요 수 등을 표시합니다.
 *
 * @example
 * // 기본 사용법 (전체 댓글 목록)
 * <CommentItemView comment={comment} />
 *
 * // 대표 댓글 (줄 수 제한, 답글 수 숨김)
 * <CommentItemView
 *   comment={comment}
 *   maxLines={3}
 *   showReplyCount={false}
 *   showPinnedBadge={false}
 * />
 */
const CommentItemView = memo(function CommentItemView({
  comment,
  maxLines,
  showReplyCount = true,
  showPinnedBadge = true,
}: CommentItemViewProps) {
  return (
    <Container>
      <AvatarContainer>
        <RoundedAvatorView source={comment.authorProfileImageUrl} size={36} />
      </AvatarContainer>
      <ContentContainer>
        <HeaderRow>
          <AuthorName numberOfLines={1}>{comment.authorName}</AuthorName>
          <PublishedTime>{comment.publishedTimeText}</PublishedTime>
          {showPinnedBadge && comment.isPinned && <PinnedBadge>고정</PinnedBadge>}
        </HeaderRow>
        <Gap size={4} />
        <CommentText numberOfLines={maxLines}>{comment.content}</CommentText>
        <Gap size={8} />
        <MetricsRow>
          {comment.likeCountText && (
            <LikeCount>
              <ThumbFilledIcon width={16} height={16} color={colors.gray02} />
              <LikeCountText>{comment.likeCountText}</LikeCountText>
            </LikeCount>
          )}
          {comment.isHearted && <HeartedBadge>❤️</HeartedBadge>}
          {showReplyCount && comment.replyCount > 0 && (
            <ReplyCount>답글 {comment.replyCount}개</ReplyCount>
          )}
        </MetricsRow>
      </ContentContainer>
    </Container>
  );
});

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

const HeaderRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const AuthorName = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  flex: 1,
});

const PublishedTime = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginLeft: 8,
});

const CommentText = styled.Text({
  ...textStyles.body3,
  color: colors.white,
  lineHeight: 20,
});

const MetricsRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const LikeCount = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
});

const LikeCountText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginLeft: 3,
});

const ReplyCount = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginLeft: 12,
});

const PinnedBadge = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginLeft: 8,
});

const HeartedBadge = styled.Text({
  marginLeft: 8,
});

export { CommentItemView };
