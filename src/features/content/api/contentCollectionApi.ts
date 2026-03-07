import { supabaseClient } from '@/core/api';
import { mapWithField } from '@/core/utils';
import { ContentLogger } from '@/core/utils';
import {
  ContentDto,
  ContentCollectionDto,
  ContentCollectionWithContentsDto,
  ContentIdItem,
} from '../types';
import { CONTENT_DATABASE } from '@/core/config';
import { contentQueryApi } from './contentQueryApi';

export const contentCollectionApi = {
  /**
   * 콘텐츠 컬렉션 목록 조회 (RPC 사용)
   * 활성 컬렉션 + 최근 비활성 컬렉션 3개를 포함하여 총 8개 반환
   * contents 정보가 이미 포함되어 있음
   */
  getContentCollections: async (): Promise<ContentCollectionWithContentsDto[]> => {
    const { data, error } = await supabaseClient.rpc(CONTENT_DATABASE.RPC.GET_CONTENT_COLLECTIONS);

    if (error) {
      ContentLogger.error('콘텐츠 컬렉션 조회 실패:', error);
      throw new Error(`Failed to fetch content collections: ${error.message}`);
    }

    // RPC 결과 타입 정의
    type RpcCollectionRow = {
      id: string;
      title: string;
      subtitle: string | null;
      theme_keywords: string[] | null;
      display_order: number;
      is_active: boolean;
      generated_at: string;
      contents: unknown[];
    };

    return (data ?? []).map(
      (row: RpcCollectionRow): ContentCollectionWithContentsDto => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle ?? undefined,
        themeKeywords: row.theme_keywords ?? undefined,
        displayOrder: row.display_order,
        isActive: row.is_active,
        contents: mapWithField<ContentDto[]>(row.contents),
      }),
    );
  },

  /**
   * 컬렉션에 포함된 콘텐츠 상세 정보 조회
   * content_ids 배열을 기반으로 contents 테이블에서 movie/tv 병렬 조회
   * @param contentIds 컬렉션의 콘텐츠 ID 목록
   * @returns 콘텐츠 상세 정보 배열
   */
  getContentsByCollectionIds: async (contentIds: ContentIdItem[]): Promise<ContentDto[]> => {
    if (contentIds.length === 0) return [];

    const movieIds = contentIds.filter((item) => item.type === 'movie').map((item) => item.id);
    const tvIds = contentIds.filter((item) => item.type === 'tv').map((item) => item.id);

    const [movies, tvShows] = await Promise.all([
      contentQueryApi.getContentsByTypeAndIds(movieIds, 'movie'),
      contentQueryApi.getContentsByTypeAndIds(tvIds, 'tv'),
    ]);

    return [...movies, ...tvShows];
  },

  /**
   * 컬렉션과 연결된 콘텐츠 상세 정보를 포함하여 조회
   * content_ids 순서를 유지하며, 중복 ID는 첫 번째만 포함
   */
  getCollectionWithContents: async (
    collection: ContentCollectionDto,
  ): Promise<ContentCollectionWithContentsDto> => {
    const contents = await contentCollectionApi.getContentsByCollectionIds(collection.contentIds);

    // 조회된 콘텐츠를 키 기반 맵으로 구성
    const contentMap = new Map<string, ContentDto>();
    contents.forEach((content) => {
      contentMap.set(`${content.id}-${content.contentType}`, content);
    });

    // contentIds 순서 유지 + 중복 제거
    const seenKeys = new Set<string>();
    const orderedContents: ContentDto[] = [];

    collection.contentIds.forEach((item) => {
      const key = `${item.id}-${item.type}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const content = contentMap.get(key);
        if (content) {
          orderedContents.push(content);
        }
      }
    });

    const result: ContentCollectionWithContentsDto = {
      id: collection.id,
      title: collection.title,
      subtitle: collection.subtitle,
      themeKeywords: collection.themeKeywords,
      displayOrder: collection.displayOrder,
      isActive: collection.isActive,
      contents: orderedContents,
    };

    return result;
  },
};
