import { ContentWithVideoDto } from '@/features/content/types';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { formatter } from '@/shared/utils/formatter';

/**
 * 러닝타임이 긴 콘텐츠 모델
 * 홈 화면의 러닝타임 섹션에서 사용
 */
export interface LongRuntimeContentModel extends BaseContentModel {
  readonly backdropPath: string | undefined;
  readonly runtime: number;
  readonly formattedRuntime: string;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LongRuntimeContentModel {
  /**
   * DTO를 Model로 변환
   */
  export function fromDto(dto: ContentWithVideoDto): LongRuntimeContentModel {
    return {
      id: dto.id,
      type: dto.contentType,
      title: dto.title,
      posterPath: dto.posterPath ?? '',
      backdropPath: dto.backdropPath,
      runtime: dto.runtime,
      formattedRuntime: formatter.formatRuntime(dto.runtime),
    };
  }

  /**
   * 초 단위 런타임을 한글 포맷으로 변환
   * @example 3120 -> "52분", 13740 -> "3시간 49분"
   */
  // export const formatRuntime = (seconds: number): string => {
  //   const hours = Math.floor(seconds / 3600);
  //   const mins = Math.floor((seconds % 3600) / 60);

  //   if (hours > 0) {
  //     return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  //   }
  //   return `${mins}분`;
  // };

  /**
   * Fisher-Yates 알고리즘으로 배열 셔플
   */
  export const shuffle = <T>(items: T[]): T[] => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as T;
      shuffled[i] = shuffled[j] as T;
      shuffled[j] = temp;
    }
    return shuffled;
  };
}
