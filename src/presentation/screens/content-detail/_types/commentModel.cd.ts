/* eslint-disable @typescript-eslint/no-namespace */
import { CommentDto } from '@/features/youtube/types';
import { formatter } from '@/shared/utils/formatter';

/**
 * CommentModel - YouTube 댓글 모델
 *
 * 댓글 목록 UI에서 사용하는 댓글 정보 모델
 */
export interface CommentModel {
  /** 댓글 고유 ID */
  readonly id: string;
  /** 댓글 내용 */
  readonly content: string;
  /** 작성자 이름 */
  readonly authorName: string;
  /** 작성자 프로필 이미지 URL */
  readonly authorProfileImageUrl: string;
  /** 작성자 채널 ID (대표 댓글 선정 시 필터링용) */
  readonly authorChannelId?: string;
  /** 좋아요 수 텍스트 (예: "1.2천") */
  readonly likeCountText: string;
  /** 작성 시간 텍스트 (예: "3일 전") */
  readonly publishedTimeText: string;
  /** 답글 수 */
  readonly replyCount: number;
  /** 하트 표시 여부 */
  readonly isHearted: boolean;
  /** 고정 댓글 여부 */
  readonly isPinned: boolean;
}

export namespace CommentModel {
  /**
   * CommentDto를 CommentModel로 변환
   */
  export function fromDto(dto: CommentDto): CommentModel {
    const base = {
      id: dto.id,
      content: dto.content,
      authorName: dto.author.name,
      authorProfileImageUrl: dto.author.profileImageUrl,
      likeCountText:
        dto.likeCountText ||
        (dto.likeCount > 0 ? formatter.formatNumberWithUnit(dto.likeCount) : ''),
      publishedTimeText: dto.publishedTimeText,
      replyCount: dto.replyCount,
      isHearted: dto.isHearted,
      isPinned: dto.isPinned,
    };

    // authorChannelId가 있는 경우에만 추가 (exactOptionalPropertyTypes 대응)
    if (dto.author.channelId) {
      return { ...base, authorChannelId: dto.author.channelId };
    }
    return base;
  }

  /**
   * CommentDto 배열을 CommentModel 배열로 변환
   */
  export function fromDtoList(dtoList: CommentDto[]): CommentModel[] {
    return dtoList.map(fromDto);
  }
}

/**
 * FeaturedCommentModel - 대표 감상평 모델
 *
 * 좋아요가 가장 많은 댓글 중 채널 주인이 작성하지 않은 댓글 정보
 */
export interface FeaturedCommentModel {
  /** 대표 댓글 (좋아요가 가장 많은 비채널주인 댓글) */
  readonly comment: CommentModel | null;
  /** 총 댓글 수 텍스트 */
  readonly totalCountText: string | undefined;
}

export namespace FeaturedCommentModel {
  /**
   * CommentDto 배열에서 대표 댓글 선정
   *
   * 선정 기준:
   * 1. 채널 주인이 작성하지 않은 댓글만 필터링
   * 2. 좋아요 수가 가장 많은 댓글 선택
   * 3. 해당 댓글이 없으면 첫 번째 댓글 (fallback)
   *
   * @param comments 댓글 DTO 배열
   * @param channelId 채널 주인 ID (필터링용)
   * @param totalCountText 총 댓글 수 텍스트
   */
  export function fromDtoList(
    comments: CommentDto[] | undefined,
    channelId: string | undefined,
    totalCountText: string | undefined,
  ): FeaturedCommentModel {
    const firstComment = comments?.[0];
    if (!comments || !firstComment) {
      return { comment: null, totalCountText };
    }

    // 채널 주인이 아닌 댓글만 필터링 (channelId가 있을 때만 필터링 적용)
    const nonOwnerComments = channelId
      ? comments.filter((comment) => comment.author.channelId !== channelId)
      : comments;

    // 좋아요 순으로 정렬하여 가장 많은 것 선택
    let topComment = firstComment;
    if (nonOwnerComments.length > 0) {
      topComment = nonOwnerComments.reduce((max, comment) => {
        return comment.likeCount > max.likeCount ? comment : max;
      });
    }

    return {
      comment: CommentModel.fromDto(topComment),
      totalCountText,
    };
  }
}
