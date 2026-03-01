/**
 * useUserManagement - 유저 관리 훅
 *
 * 무한스크롤 + 필터 + 검색 + 정렬 로직을 관리합니다.
 */

import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import {
  adminUserApi,
  type UserRoleCounts,
  type UserStatistics,
  type UserRoleFilter,
  type UserSortBy,
  type UserSearchField,
} from '@/features/admin';
import { UserManagementModel } from '../_types';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;
/** 검색어 최대 길이 */
const MAX_SEARCH_QUERY_LENGTH = 100;
/** 검색어 최소 길이 (검색 실행 시) */
const MIN_SEARCH_QUERY_LENGTH = 1;

const QUERY_KEYS = {
  statistics: ['adminUserStatistics'] as const,
  roleCounts: ['adminUserRoleCounts'] as const,
  users: (params: UserListQueryParams) =>
    ['adminUsers', params.role, params.searchQuery, params.searchField, params.sortBy] as const,
} as const;

const DEFAULT_COUNTS: UserRoleCounts = {
  total: 0,
  user: 0,
  admin: 0,
  banned: 0,
};

const DEFAULT_STATISTICS: UserStatistics = {
  totalUsers: 0,
  totalDau: 0,
  memberDau: 0,
  nonMemberDau: 0,
  newUsersToday: 0,
};

// ============================================================================
// Types
// ============================================================================

interface UserListQueryParams {
  role: UserRoleFilter;
  searchQuery: string | null;
  searchField: UserSearchField;
  sortBy: UserSortBy;
}

interface UseUserManagementReturn {
  /** 유저 목록 */
  readonly users: UserManagementModel[];
  /** 역할별 카운트 */
  readonly counts: UserRoleCounts;
  /** 대시보드 통계 */
  readonly statistics: UserStatistics;
  /** 선택된 역할 필터 */
  readonly selectedRole: UserRoleFilter;
  /** 역할 필터 변경 */
  readonly onSelectRole: (role: UserRoleFilter) => void;
  /** 검색어 */
  readonly searchQuery: string;
  /** 검색 필드 */
  readonly searchField: UserSearchField;
  /** 검색어 변경 */
  readonly onSearchChange: (query: string) => void;
  /** 검색 필드 변경 */
  readonly onSearchFieldChange: (field: UserSearchField) => void;
  /** 검색 실행 */
  readonly onSearch: () => void;
  /** 정렬 기준 */
  readonly sortBy: UserSortBy;
  /** 정렬 기준 변경 */
  readonly onSortChange: (sort: UserSortBy) => void;
  /** 로딩 중 여부 */
  readonly isLoading: boolean;
  /** 통계 로딩 중 여부 */
  readonly isStatisticsLoading: boolean;
  /** 추가 로딩 중 여부 */
  readonly isFetchingNextPage: boolean;
  /** 다음 페이지 존재 여부 */
  readonly hasNextPage: boolean;
  /** 다음 페이지 로드 */
  readonly fetchNextPage: () => void;
  /** 새로고침 */
  readonly refetch: () => void;
  /** 새로고침 중 여부 */
  readonly isRefreshing: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useUserManagement(): UseUserManagementReturn {
  const queryClient = useQueryClient();

  // 필터/검색/정렬 상태
  const [selectedRole, setSelectedRole] = useState<UserRoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<UserSearchField>('email');
  const [sortBy, setSortBy] = useState<UserSortBy>('lastLoginAt');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 현재 쿼리 파라미터
  const queryParams: UserListQueryParams = useMemo(
    () => ({
      role: selectedRole,
      searchQuery: appliedSearchQuery,
      searchField,
      sortBy,
    }),
    [selectedRole, appliedSearchQuery, searchField, sortBy],
  );

  // 대시보드 통계 조회
  const { data: statistics = DEFAULT_STATISTICS, isLoading: isStatisticsLoading } = useQuery({
    queryKey: QUERY_KEYS.statistics,
    queryFn: adminUserApi.getUserStatistics,
    staleTime: 60 * 1000, // 1분
  });

  // 역할별 카운트 조회
  const { data: counts = DEFAULT_COUNTS } = useQuery({
    queryKey: QUERY_KEYS.roleCounts,
    queryFn: adminUserApi.getUserRoleCounts,
    staleTime: 30 * 1000, // 30초
  });

  // 유저 목록 무한스크롤 조회
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage = false,
    fetchNextPage: fetchNextPageQuery,
    refetch: refetchUsers,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.users(queryParams),
    queryFn: ({ pageParam }) =>
      adminUserApi.getUsers({
        role: queryParams.role,
        searchQuery: queryParams.searchQuery,
        searchField: queryParams.searchField,
        sortBy: queryParams.sortBy,
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30초
  });

  // 전체 유저 목록 평탄화 및 DTO -> Model 변환
  const users = useMemo(
    () => data?.pages.flatMap((page) => UserManagementModel.fromDtos(page.users)) ?? [],
    [data],
  );

  // 역할 필터 변경
  const onSelectRole = useCallback((role: UserRoleFilter) => {
    setSelectedRole(role);
  }, []);

  // 검색어 변경 (입력 중) - 최대 길이 제한
  const onSearchChange = useCallback((query: string) => {
    // 최대 길이 초과 시 무시
    if (query.length > MAX_SEARCH_QUERY_LENGTH) return;
    setSearchQuery(query);
  }, []);

  // 검색 필드 변경
  const onSearchFieldChange = useCallback((field: UserSearchField) => {
    setSearchField(field);
  }, []);

  // 검색 실행
  const onSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    // 빈 문자열이거나 최소 길이 미만이면 null로 설정 (전체 조회)
    if (trimmedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      setAppliedSearchQuery(null);
      return;
    }
    setAppliedSearchQuery(trimmedQuery);
  }, [searchQuery]);

  // 정렬 기준 변경
  const onSortChange = useCallback((sort: UserSortBy) => {
    setSortBy(sort);
  }, []);

  // 다음 페이지 로드
  const fetchNextPage = useCallback(() => {
    const canFetchMore = hasNextPage && !isFetchingNextPage;
    if (canFetchMore) {
      fetchNextPageQuery();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPageQuery]);

  // 새로고침 (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roleCounts }),
        refetchUsers(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetchUsers]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roleCounts });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }, [queryClient]),
  );

  return {
    users,
    counts,
    statistics,
    selectedRole,
    onSelectRole,
    searchQuery,
    searchField,
    onSearchChange,
    onSearchFieldChange,
    onSearch,
    sortBy,
    onSortChange,
    isLoading,
    isStatisticsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: handleRefresh,
    isRefreshing,
  };
}
