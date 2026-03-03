import { BaseContentModel } from '@/shared/types/content/baseContentModel';

/**
 * 포스토 콘텐츠
 */
/* eslint-disable semi */
export default interface PosterContentModel extends BaseContentModel {
  readonly posterImg: string;
}
/* eslint-enable semi */
