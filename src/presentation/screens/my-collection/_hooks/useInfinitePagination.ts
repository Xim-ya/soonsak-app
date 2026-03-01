import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { UserContentItem } from '../_types';

const PAGE_SIZE = 20;

/**
 * 페이지네이션 응답 타입 (공통 인터페이스)
 */
interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * 아이템 매퍼 함수 타입
 */
type ItemMapper<TSource> = (item: TSource) => UserContentItem;

interface UseInfinitePaginationResult {
  items: UserContentItem[];
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;
  fetchNextPage: () => void;
}

interface UseInfinitePaginationOptions<TSource> {
  /** Query hook을 호출하는 함수 */
  useQueryHook: (
    limit: number,
    offset: number,
  ) => UseQueryResult<PaginatedResponse<TSource>, Error>;
  /** 소스 아이템을 UserContentItem으로 변환하는 함수 */
  mapItem: ItemMapper<TSource>;
}

/**
 * useInfinitePagination - 무한 스크롤 페이지네이션 공통 Hook
 *
 * 찜/평가/시청완료 탭에서 공통으로 사용하는 페이지네이션 로직을 추상화합니다.
 * - 데이터 누적 관리
 * - 페이지 오프셋 관리
 * - 로딩 상태 관리
 *
 * @example
 * ```typescript
 * const mapItem = useCallback((item) => ({
 *   id: item.id,
 *   contentId: item.contentId,
 *   // ...
 * }), []);
 *
 * return useInfinitePagination({
 *   useQueryHook: useFavoritesList,
 *   mapItem,
 * });
 * ```
 */
export function useInfinitePagination<TSource>({
  useQueryHook,
  mapItem,
}: UseInfinitePaginationOptions<TSource>): UseInfinitePaginationResult {
  const [offset, setOffset] = useState(0);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // 이전 페이지 아이템을 저장하는 ref (무한 스크롤용)
  const previousItemsRef = useRef<UserContentItem[]>([]);

  const query = useQueryHook(PAGE_SIZE, offset);

  // 동기적으로 아이템 계산 (useEffect 대신 useMemo 사용으로 깜빡임 방지)
  const items = useMemo(() => {
    // 실제 데이터가 아직 없으면 이전 아이템 유지
    if (!query.data || query.isPlaceholderData) {
      return previousItemsRef.current;
    }

    const newItems = query.data.items.map(mapItem);

    // 첫 페이지면 새 아이템만, 아니면 이전 + 새 아이템
    const result = offset === 0 ? newItems : [...previousItemsRef.current, ...newItems];

    // ref 업데이트 (다음 페이지 로딩을 위해)
    previousItemsRef.current = result;

    return result;
  }, [query.data, query.isPlaceholderData, offset, mapItem]);

  // isFetchingNextPage 상태 업데이트
  useEffect(() => {
    if (query.data && !query.isPlaceholderData) {
      setIsFetchingNextPage(false);
    }
  }, [query.data, query.isPlaceholderData]);

  // 초기 로딩: 아이템이 없고 데이터를 가져오는 중
  const isInitialLoading = items.length === 0 && (query.isFetching || query.isPlaceholderData);

  const fetchNextPage = useCallback(() => {
    const canFetchNext = query.data?.hasMore && !query.isFetching && !isFetchingNextPage;

    if (canFetchNext) {
      setIsFetchingNextPage(true);
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [query.data?.hasMore, query.isFetching, isFetchingNextPage]);

  return {
    items,
    isLoading: isInitialLoading,
    hasMore: query.data?.hasMore ?? false,
    totalCount: query.data?.totalCount ?? 0,
    fetchNextPage,
  };
}
