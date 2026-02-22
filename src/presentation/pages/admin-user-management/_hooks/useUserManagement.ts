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
  type UserManagementItem,
  type UserRoleCounts,
  type UserStatistics,
  type UserRoleFilter,
  type UserSortBy,
  type UserSearchField,
} from '@/features/admin';

const PAGE_SIZE = 20;

interface UseUserManagementReturn {
  /** 유저 목록 */
  readonly users: UserManagementItem[];
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

export function useUserManagement(): UseUserManagementReturn {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<UserSearchField>('email');
  const [sortBy, setSortBy] = useState<UserSortBy>('createdAt');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 대시보드 통계 조회
  const { data: statistics = DEFAULT_STATISTICS, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ['adminUserStatistics'],
    queryFn: adminUserApi.getUserStatistics,
    staleTime: 60 * 1000, // 1분
  });

  // 역할별 카운트 조회
  const { data: counts = DEFAULT_COUNTS } = useQuery({
    queryKey: ['adminUserRoleCounts'],
    queryFn: adminUserApi.getUserRoleCounts,
    staleTime: 30 * 1000, // 30초
  });

  // 유저 목록 무한스크롤 조회
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage = false,
    fetchNextPage,
    refetch: refetchUsers,
  } = useInfiniteQuery({
    queryKey: ['adminUsers', selectedRole, appliedSearchQuery, searchField, sortBy],
    queryFn: ({ pageParam }) =>
      adminUserApi.getUsers({
        role: selectedRole,
        searchQuery: appliedSearchQuery,
        searchField,
        sortBy,
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30초
  });

  // 전체 유저 목록 평탄화
  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page.users) ?? [];
  }, [data]);

  // 역할 필터 변경
  const onSelectRole = useCallback((role: UserRoleFilter) => {
    setSelectedRole(role);
  }, []);

  // 검색어 변경 (입력 중)
  const onSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 검색 필드 변경
  const onSearchFieldChange = useCallback((field: UserSearchField) => {
    setSearchField(field);
  }, []);

  // 검색 실행
  const onSearch = useCallback(() => {
    setAppliedSearchQuery(searchQuery.trim() || null);
  }, [searchQuery]);

  // 정렬 기준 변경
  const onSortChange = useCallback((sort: UserSortBy) => {
    setSortBy(sort);
  }, []);

  // 다음 페이지 로드
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 새로고침 (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['adminUserStatistics'] }),
        queryClient.invalidateQueries({ queryKey: ['adminUserRoleCounts'] }),
        refetchUsers(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetchUsers]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['adminUserStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['adminUserRoleCounts'] });
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
    fetchNextPage: handleFetchNextPage,
    refetch: handleRefresh,
    isRefreshing,
  };
}

const DEFAULT_COUNTS: UserRoleCounts = {
  total: 0,
  user: 0,
  admin: 0,
  banned: 0,
};

const DEFAULT_STATISTICS: UserStatistics = {
  totalUsers: 0,
  dailyActiveVisitors: 0,
  activePushTokens: 0,
};
