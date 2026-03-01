import { useMemo } from 'react';
import { useYouTubeComments } from '@/features/youtube';
import { useContentVideos } from '../_provider/ContentDetailProvider';
import { CommentModel, FeaturedCommentModel } from '../_types/commentModel.cd';

interface UseFeaturedCommentResult {
  /** 대표 댓글 (좋아요가 가장 많은 비채널주인 댓글) */
  featuredComment: CommentModel | null;
  /** 총 댓글 수 텍스트 */
  totalCountText: string | undefined;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 */
  error: Error | null;
}

/**
 * useFeaturedComment - 대표 감상평 조회 훅
 *
 * 좋아요가 가장 많은 댓글 중 채널 주인이 작성하지 않은 댓글을 반환합니다.
 *
 * @example
 * const { featuredComment, totalCountText, isLoading } = useFeaturedComment();
 */
export function useFeaturedComment(): UseFeaturedCommentResult {
  const { primaryVideo, commentToken, commentTotalCountText, isCommentTokenLoading } =
    useContentVideos();
  const videoId = primaryVideo?.id;

  const {
    data: commentsData,
    isLoading,
    error,
  } = useYouTubeComments(videoId, {
    token: commentToken,
    totalCountText: commentTotalCountText,
    isTokenLoading: isCommentTokenLoading,
  });

  // DTO -> Model 변환 (대표 댓글 선정 로직 포함)
  const featuredCommentModel = useMemo(() => {
    return FeaturedCommentModel.fromDtoList(
      commentsData?.comments,
      primaryVideo?.channelId,
      commentsData?.totalCountText ?? commentTotalCountText,
    );
  }, [
    commentsData?.comments,
    commentsData?.totalCountText,
    primaryVideo?.channelId,
    commentTotalCountText,
  ]);

  return {
    featuredComment: featuredCommentModel.comment,
    totalCountText: featuredCommentModel.totalCountText,
    isLoading,
    error,
  };
}
