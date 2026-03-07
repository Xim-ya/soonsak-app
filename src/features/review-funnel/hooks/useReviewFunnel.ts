import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/features/auth';
import { openStoreReviewPage } from '@/core/utils/storeUtils';
import { appConfigApi } from '@/features/app-config/api/appConfigApi';
import { Logger } from '@/core/utils';
import { reviewFunnelApi } from '../api/reviewFunnelApi';
import type { ReviewFunnelSessionDto, ReviewType, RecommendedContent } from '../types';

const ReviewFunnelLogger = Logger.create('ReviewFunnel');

type FunnelViewStep = 'letter' | 'content';

interface UseReviewFunnelReturn {
  /** 현재 뷰 단계 (letter / content) */
  viewStep: FunnelViewStep;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 유저 이름 */
  userName: string;
  /** 시청한 콘텐츠 목록 (최대 3개) */
  watchedContents: RecommendedContent[];
  /** 편지 확인 버튼 클릭 */
  handleLetterOpen: () => void;
  /** 평점만 남기기 클릭 (인앱 리뷰) */
  handleRatingOnlyClick: () => Promise<void>;
  /** 리뷰 내용 작성 클릭 (스토어 URL) */
  handleWriteReviewClick: () => Promise<void>;
  /** 닫기 버튼 클릭 */
  handleClose: () => void;
}

/**
 * 리뷰 퍼널 로직 훅
 */
export function useReviewFunnel(): UseReviewFunnelReturn {
  const navigation = useNavigation();
  const { displayName } = useAuth();

  const [viewStep, setViewStep] = useState<FunnelViewStep>('letter');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchedContents, setWatchedContents] = useState<RecommendedContent[]>([]);
  const userName = displayName;

  // 세션 참조 (리렌더링 방지)
  const sessionRef = useRef<ReviewFunnelSessionDto | null>(null);
  // 서버 스토어 URL 참조
  const storeUrlRef = useRef<string | null>(null);

  /**
   * 초기화: 세션 생성 + 진입 처리 + 콘텐츠 로드 + 스토어 URL 조회
   */
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);

        // 1. 퍼널 세션 조회 또는 생성 (유저당 1개)
        const session = await reviewFunnelApi.getOrCreateSession({
          platform: Platform.OS as 'ios' | 'android',
          appVersion: Constants.expoConfig?.version,
        });

        if (!isMounted) return;
        sessionRef.current = session;

        // 2. 병렬 처리: 진입 처리 + 시청기록 로드 + 스토어 URL 조회
        const shouldMarkEntered = session.hasReviewed !== true;
        const [, contents, versionPolicy] = await Promise.all([
          shouldMarkEntered ? reviewFunnelApi.markAsEntered(session.id) : Promise.resolve(),
          reviewFunnelApi.getRandomWatchedContents(3),
          appConfigApi.getVersionPolicy(),
        ]);

        if (!isMounted) return;
        setWatchedContents(contents);
        storeUrlRef.current = versionPolicy?.storeUrl ?? null;
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        ReviewFunnelLogger.error('퍼널 초기화 실패:', err);
        setError('초기화에 실패했습니다.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * 편지 확인 버튼 클릭 (letter → content)
   */
  const handleLetterOpen = useCallback(() => {
    setViewStep('content');
  }, []);

  /**
   * 리뷰 완료 처리 공통 로직
   * @param reviewType - 'rating_only': 평점만, 'write_review': 리뷰 내용도
   */
  const markReviewCompleted = useCallback(async (reviewType: ReviewType) => {
    const session = sessionRef.current;
    if (session) {
      // has_reviewed: false → true + review_type 저장
      await reviewFunnelApi.markAsReviewed(session.id, reviewType);
    }
  }, []);

  /**
   * 평점만 남기기 클릭 (인앱 리뷰)
   * iOS: 평점만 남기기 선택 시 / Android: 기본 리뷰 버튼 클릭 시
   */
  const handleRatingOnlyClick = useCallback(async () => {
    try {
      // iOS는 평점만/리뷰작성 구분, Android는 인앱 리뷰로 통합
      const isIOS = Platform.OS === 'ios';
      const reviewType: ReviewType = isIOS ? 'rating_only' : 'in_app_review';
      await markReviewCompleted(reviewType);

      // Android 개발환경에서는 in-app review 다이얼로그가 표시되지 않음
      const isAndroidDev = Platform.OS === 'android' && __DEV__;
      const canUseInAppReview = !isAndroidDev;

      if (canUseInAppReview) {
        try {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
            return;
          }
        } catch {
          // in-app review 불가 시 스토어 URL로 폴백
        }
      }

      // 스토어 URL로 이동 (fallback)
      await openStoreReviewPage(storeUrlRef.current);
    } catch (err) {
      ReviewFunnelLogger.error('인앱 리뷰 요청 실패:', err);
    }
  }, [markReviewCompleted]);

  /**
   * 리뷰 내용 작성 클릭 (스토어 URL로 이동)
   * iOS에서 "리뷰 내용도 적을게요" 선택 시
   */
  const handleWriteReviewClick = useCallback(async () => {
    try {
      await markReviewCompleted('write_review');
      await openStoreReviewPage(storeUrlRef.current);
    } catch (err) {
      ReviewFunnelLogger.error('스토어 리뷰 요청 실패:', err);
    }
  }, [markReviewCompleted]);

  /**
   * 닫기 버튼 클릭
   * 이미 has_reviewed가 true면 변경 안 됨 (API에서 처리)
   */
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    viewStep,
    isLoading,
    error,
    userName,
    watchedContents,
    handleLetterOpen,
    handleRatingOnlyClick,
    handleWriteReviewClick,
    handleClose,
  };
}
