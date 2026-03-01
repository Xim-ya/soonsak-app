import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/features/content/api/contentApi';
import { SearchResultModel } from '../_types/searchResultModel';

/** 캐시 유지 시간 (5분) */
const STALE_TIME_MS = 1000 * 60 * 5;

/**
 * useSearch - 검색 기능을 위한 훅
 *
 * 한글 검색의 다양한 시나리오를 지원합니다:
 * - 공백 무시: "그 을" → "그을린 사랑" 매칭
 * - 초성 검색: "ㄱㅇㄹ" → "그을린" 매칭
 * - 혼합 검색: "ㅂ레이킹" → "브레이킹 배드" 매칭
 * - 유사도 검색: "브레이킹베드" → "브레이킹 배드" 매칭 (오타 허용)
 *
 * @param query - 검색어 (debounce 처리된 값 권장)
 * @returns 검색 결과, 로딩 상태, 에러 상태
 *
 * @example
 * const debouncedQuery = useDebounce(searchText, 350);
 * const { data, isLoading } = useSearch(debouncedQuery);
 */
export function useSearch(query: string) {
  const trimmedQuery = query.trim();
  const isEnabled = trimmedQuery.length > 0;

  const { data, isLoading, isFetching, error, refetch } = useQuery<SearchResultModel[], Error>({
    queryKey: ['search', trimmedQuery],
    queryFn: async (): Promise<SearchResultModel[]> => {
      const contents = await contentApi.searchContentsKorean(trimmedQuery);
      return SearchResultModel.fromDtoList(contents);
    },
    enabled: isEnabled,
    staleTime: STALE_TIME_MS,
    retry: false,
  });

  return {
    data: data ?? [],
    isLoading: (isLoading || isFetching) && isEnabled,
    error: error as Error | null,
    refetch,
    isEmpty: isEnabled && !isLoading && !isFetching && (data?.length ?? 0) === 0,
  };
}
