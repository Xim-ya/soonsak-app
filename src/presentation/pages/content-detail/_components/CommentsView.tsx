import React, { useMemo, memo } from 'react';
import { FlatList } from 'react-native';
import styled from '@emotion/native';
import { RoundedAvatorView } from '@/presentation/components/image/RoundedAvatarView';
import { SkeletonView } from '@/presentation/components/loading/SkeletonView';
import Gap from '@/presentation/components/view/Gap';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { useYouTubeComments } from '@/features/youtube';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { CommentModel } from '../_types/commentModel.cd';

interface CommentItemProps {
  readonly comment: CommentModel;
}

/**
 * 개별 댓글 아이템 컴포넌트
 */
const CommentItem = memo(function CommentItem({ comment }: CommentItemProps) {
  return (
    <CommentItemContainer>
      <AvatarContainer>
        <RoundedAvatorView source={comment.authorProfileImageUrl} size={36} />
      </AvatarContainer>
      <ContentContainer>
        <HeaderRow>
          <AuthorName numberOfLines={1}>{comment.authorName}</AuthorName>
          <PublishedTime>{comment.publishedTimeText}</PublishedTime>
          {comment.isPinned && <PinnedBadge>고정</PinnedBadge>}
        </HeaderRow>
        <Gap size={4} />
        <CommentText numberOfLines={4}>{comment.content}</CommentText>
        <Gap size={8} />
        <MetricsRow>
          {comment.likeCountText && <LikeCount>👍 {comment.likeCountText}</LikeCount>}
          {comment.isHearted && <HeartedBadge>❤️</HeartedBadge>}
          {comment.replyCount > 0 && <ReplyCount>답글 {comment.replyCount}개</ReplyCount>}
        </MetricsRow>
      </ContentContainer>
    </CommentItemContainer>
  );
});

/**
 * 댓글 아이템 구분선
 */
const ItemSeparator = (): React.ReactElement => <Gap size={16} />;

/**
 * 댓글 스켈레톤 아이템
 */
function CommentSkeleton(): React.ReactElement {
  return (
    <CommentItemContainer>
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
    </CommentItemContainer>
  );
}

/**
 * 로딩 스켈레톤 리스트
 */
function LoadingSkeleton(): React.ReactElement {
  return (
    <>
      <CommentSkeleton />
      <Gap size={16} />
      <CommentSkeleton />
      <Gap size={16} />
      <CommentSkeleton />
    </>
  );
}

/**
 * CommentsView - YouTube 댓글 섹션 컴포넌트
 *
 * 현재 재생 중인 비디오의 댓글 목록을 표시합니다.
 * 댓글이 없거나 로드 실패 시 섹션이 숨겨집니다.
 *
 * 2단계 최적화:
 * - 페이지 진입 시 token이 미리 prefetch됨 (ContentDetailProvider)
 * - 댓글 탭 진입 시 token으로 댓글만 조회 (더 빠름)
 */
function CommentsView(): React.ReactElement | null {
  const { primaryVideo, commentToken, commentTotalCountText, isCommentTokenLoading } =
    useContentVideos();
  const videoId = primaryVideo?.id;

  // prefetch된 token 사용 (더 빠른 로딩)
  const {
    data: commentsData,
    isLoading,
    error,
  } = useYouTubeComments(videoId, {
    token: commentToken,
    totalCountText: commentTotalCountText,
    isTokenLoading: isCommentTokenLoading,
  });

  // DTO를 Model로 변환
  const comments = useMemo(() => {
    if (!commentsData?.comments) return [];
    return CommentModel.fromDtoList(commentsData.comments);
  }, [commentsData?.comments]);

  // 에러 발생 시 또는 댓글이 없으면 렌더링하지 않음
  if (error || (!isLoading && comments.length === 0)) {
    return null;
  }

  return (
    <Container>
      <HeaderContainer>
        <SectionTitle>댓글</SectionTitle>
        {commentsData?.totalCountText && <CommentCount>{commentsData.totalCountText}</CommentCount>}
      </HeaderContainer>
      <Gap size={16} />

      {isLoading ? (
        <CommentsContainer>
          <LoadingSkeleton />
        </CommentsContainer>
      ) : (
        <FlatList
          data={comments}
          renderItem={({ item }) => <CommentItem comment={item} />}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={ItemSeparator}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      )}
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  backgroundColor: colors.black,
  paddingTop: 24,
  paddingBottom: 40,
});

const HeaderContainer = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
});

const SectionTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const CommentCount = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  marginLeft: 8,
});

const CommentsContainer = styled.View({
  paddingHorizontal: 16,
});

const CommentItemContainer = styled.View({
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

const LikeCount = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
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

export { CommentsView };
