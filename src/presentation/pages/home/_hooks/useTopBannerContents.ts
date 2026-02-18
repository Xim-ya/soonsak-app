import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { ICarouselInstance } from 'react-native-reanimated-carousel';
import { TopContentModel, fromContentDto, isValidTopContent } from '../_types/TopContentModel';
import { contentApi } from '@/features/content/api/contentApi';
import { getPreloadedBannerContents } from '@/shared/hooks/useAppPreload';

/** 배너에 표시할 콘텐츠 수 */
const BANNER_CONTENT_LIMIT = 5;

/** 쿼리 재시도 횟수 */
const QUERY_RETRY_COUNT = 2;

/** Opacity 애니메이션 임계값 */
const OPACITY_THRESHOLDS = {
  /** 완전 표시 임계값 - 이 값 이상일 때 텍스트가 선명하게 보임 */
  VISIBLE: 0.6,
  /** 전환 중간 지점 하한 */
  TRANSITION_LOWER: 0.48,
  /** 전환 중간 지점 상한 */
  TRANSITION_UPPER: 0.52,
} as const;

/** 아이템 전환 임계값 (이 값 이상일 때 다음 아이템으로 전환) */
const ITEM_SWITCH_THRESHOLD = 0.5;

/** 애니메이션 지속 시간 (ms) */
const ANIMATION_DURATION_MS = 100;

/**
 * 홈 상단 배너 캐러셀 데이터 및 인터렉션 관리
 * - 매 세션마다 랜덤 콘텐츠 조회
 * - 캐러셀 애니메이션 처리
 */
export function useTopBannerContents() {
  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const infoOpacity = useSharedValue<number>(1);
  const [currentItem, setCurrentItem] = useState<TopContentModel | null>(null);

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['topBannerContents'],
    queryFn: async (): Promise<TopContentModel[]> => {
      // 프리로드된 데이터 우선 사용 (스플래시에서 미리 로드)
      const preloaded = getPreloadedBannerContents();
      const contents =
        preloaded ?? (await contentApi.getRandomBannerContents(BANNER_CONTENT_LIMIT));

      // 빈 배열 또는 null/undefined 처리
      if (!contents || contents.length === 0) {
        return [];
      }
      // DTO 변환 후 유효한 데이터만 필터링 (필수 필드 검증)
      return contents.map(fromContentDto).filter(isValidTopContent);
    },
    staleTime: Infinity, // 세션 동안 캐시 유지 (새로고침 시에만 새 데이터)
    gcTime: Infinity,
    retry: QUERY_RETRY_COUNT, // 네트워크 오류 시 재시도
  });

  // 메모이제이션된 headerInfo - 빈 배열 기본값
  const headerInfo = useMemo(() => data ?? [], [data]);

  // 에러 발생 시 재시도 핸들러
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const onPressPagination = useCallback(
    (index: number) => {
      ref.current?.scrollTo({
        count: index - progress.value,
        animated: true,
      });
    },
    [progress],
  );

  // 페이지 변경 시 opacity 애니메이션 처리
  const onProgressChange = (_offsetProgress: number, absoluteProgress: number) => {
    progress.value = absoluteProgress;

    // 중간 지점에서 아이템 변경 (Flutter와 동일한 로직)
    const hasItems = headerInfo && headerInfo.length > 0;
    if (hasItems) {
      const remainder = absoluteProgress % 1;
      const shouldSwitchToNext = remainder >= ITEM_SWITCH_THRESHOLD;
      const targetIndex = shouldSwitchToNext
        ? Math.ceil(absoluteProgress)
        : Math.floor(absoluteProgress);
      const safeIndex = targetIndex % headerInfo.length;
      const item = headerInfo[safeIndex];

      if (item && item !== currentItem) {
        setCurrentItem(item);
      }
    }

    // Opacity 애니메이션 처리
    const remainder = absoluteProgress % 1;
    const opacity = 1 - remainder;

    const isFullyVisible = opacity > OPACITY_THRESHOLDS.VISIBLE;
    const isAtTransitionMidpoint =
      opacity > OPACITY_THRESHOLDS.TRANSITION_LOWER &&
      opacity < OPACITY_THRESHOLDS.TRANSITION_UPPER;

    if (isFullyVisible) {
      // 현재 아이템이 선명하게 보이는 상태
      infoOpacity.value = withTiming(opacity, { duration: ANIMATION_DURATION_MS });
    } else if (isAtTransitionMidpoint) {
      // 전환 중간 지점: 완전히 숨김
      infoOpacity.value = withTiming(0, { duration: ANIMATION_DURATION_MS });
    } else {
      // 다음 아이템으로 전환 중: 점진적으로 나타남
      infoOpacity.value = withTiming(remainder, { duration: ANIMATION_DURATION_MS });
    }
  };

  // 스냅 완료 시 호출되는 함수
  const onSnapToItem = (index: number) => {
    if (headerInfo && headerInfo.length > 0 && index >= 0 && index < headerInfo.length) {
      const item = headerInfo[index];
      if (item) {
        setCurrentItem(item);
      }
    }
  };

  // 초기 아이템 설정
  useEffect(() => {
    if (headerInfo.length > 0 && !currentItem) {
      const firstItem = headerInfo[0];
      if (firstItem) {
        setCurrentItem(firstItem);
      }
    }
  }, [headerInfo, currentItem]);

  return {
    // Data
    headerInfo,
    currentItem,
    isError,
    isLoading,

    // Refs & Values
    ref,
    progress,
    infoOpacity,

    // Handlers
    onPressPagination,
    onProgressChange,
    onSnapToItem,
    handleRetry,
  };
}
