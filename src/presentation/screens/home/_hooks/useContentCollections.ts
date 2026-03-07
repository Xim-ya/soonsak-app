import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api';
import { ContentCollectionModel } from '../_types/contentCollectionModel.home';

const QUERY_KEY = 'contentCollections_v2';
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * 콘텐츠 컬렉션 목록을 조회하는 훅
 * RPC를 통해 활성 컬렉션 + 최근 비활성 컬렉션을 포함하여 8개 반환
 * 레이지 로드: enabled 옵션으로 조건부 로딩 지원
 */
export function useContentCollections(enabled: boolean = true) {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<ContentCollectionModel[]> => {
      // RPC가 contents를 이미 포함하여 반환
      const collections = await contentApi.getContentCollections();
      return collections.map(ContentCollectionModel.fromDto);
    },
    staleTime: STALE_TIME_MS,
    enabled,
  });
}
