import { BaseContentModel } from '@/presentation/types/content/baseContentModel';

/**
 * 홈스크린 > 콘텐츠 섹션 리스트
 */
interface ContentSectionListModel {
  id: string;
  sectionTitle: string;
  contents: BaseContentModel[];
}

export type { ContentSectionListModel };
