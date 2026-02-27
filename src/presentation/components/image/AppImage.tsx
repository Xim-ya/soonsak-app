/**
 * AppImage - 캐싱 정책을 지원하는 이미지 컴포넌트
 *
 * expo-image로 쉽게 전환할 수 있도록 설계된 이미지 컴포넌트입니다.
 * 현재는 React Native Image를 사용하며, expo-image 설치 후 내부 구현만 교체하면 됩니다.
 *
 * ## 설계 원칙 (Toss Frontend Fundamentals)
 *
 * ### Readability (가독성)
 * - CachePolicy enum으로 매직 스트링 방지
 * - ContentFit enum으로 명확한 이미지 맞춤 옵션 제공
 * - 명확한 props 네이밍 (cachePolicy, contentFit, transition)
 *
 * ### Predictability (예측가능성)
 * - LoadableImageView와 유사한 인터페이스
 * - 일관된 에러/로딩 상태 처리
 * - 콜백 함수의 일관된 시그니처
 *
 * ### Cohesion (응집도)
 * - 캐싱 관련 타입/상수를 같은 파일에 정의
 * - 이미지 로딩 상태 관리 로직을 useImageLoadState 훅으로 응집
 *
 * ### Coupling (결합도)
 * - 내부 이미지 렌더링 로직을 분리하여 expo-image 전환 용이
 * - 외부에서는 AppImage 인터페이스만 사용
 *
 * @example
 * // 기본 사용 (디스크 캐싱)
 * <AppImage
 *   source="https://example.com/image.jpg"
 *   width={200}
 *   height={150}
 * />
 *
 * @example
 * // 캐싱 정책 지정
 * <AppImage
 *   source="https://example.com/image.jpg"
 *   width={200}
 *   height={150}
 *   cachePolicy={CachePolicy.MemoryDisk}
 *   contentFit={ContentFit.Contain}
 *   transition={200}
 * />
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import styled from '@emotion/native';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import colors from '@/shared/styles/colors';
import { ImageErrorPlaceholder } from './ImageErrorPlaceholder';

// ============================================================================
// Types & Constants (응집도: 관련 타입을 함께 정의)
// ============================================================================

/**
 * 캐싱 정책 (Readability: 매직 스트링 대신 enum 사용)
 *
 * expo-image의 cachePolicy와 동일한 값을 사용하여 전환 시 호환성 보장
 */
export const CachePolicy = {
  /** 캐싱 없음 - 매번 네트워크 요청 */
  None: 'none',
  /** 메모리 캐시만 사용 */
  Memory: 'memory',
  /** 디스크 캐시만 사용 */
  Disk: 'disk',
  /** 메모리 + 디스크 캐시 (기본값, 가장 효율적) */
  MemoryDisk: 'memory-disk',
} as const;

export type CachePolicyType = (typeof CachePolicy)[keyof typeof CachePolicy];

/**
 * 이미지 맞춤 방식 (Readability: 명확한 옵션 제공)
 *
 * expo-image의 contentFit과 동일한 값 사용
 */
export const ContentFit = {
  /** 이미지 비율 유지, 컨테이너를 완전히 채움 (잘릴 수 있음) */
  Cover: 'cover',
  /** 이미지 비율 유지, 컨테이너 안에 완전히 들어감 */
  Contain: 'contain',
  /** 컨테이너에 맞게 이미지 늘림 (비율 변경) */
  Fill: 'fill',
} as const;

export type ContentFitType = (typeof ContentFit)[keyof typeof ContentFit];

/**
 * Placeholder 옵션
 */
interface PlaceholderOptions {
  /** Blurhash 문자열 (expo-image 전환 시 사용) */
  blurhash?: string;
  /** Thumbhash 문자열 (expo-image 전환 시 사용) */
  thumbhash?: string;
}

/**
 * AppImage Props (Predictability: LoadableImageView와 유사한 인터페이스)
 */
export interface AppImageProps {
  /** 이미지 URL */
  source: string;
  /** 이미지 너비 */
  width: number;
  /** 이미지 높이 */
  height: number;
  /** 캐싱 정책 (기본값: MemoryDisk) */
  cachePolicy?: CachePolicyType;
  /** 이미지 맞춤 방식 (기본값: Cover) */
  contentFit?: ContentFitType;
  /** 트랜지션 애니메이션 시간 (ms, 기본값: 300) */
  transition?: number;
  /** Placeholder 옵션 (blurhash 등) */
  placeholder?: PlaceholderOptions;
  /** 모서리 둥글기 */
  borderRadius?: number;
  /** 배경 투명 처리 (로고 등에 사용) */
  transparent?: boolean;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 이미지 로드 완료 콜백 */
  onLoad?: () => void;
  /** 이미지 로드 실패 콜백 */
  onError?: (error?: Error) => void;
}

// ============================================================================
// Custom Hook (응집도: 이미지 로딩 상태 관리 로직 분리)
// ============================================================================

interface ImageLoadState {
  isLoading: boolean;
  hasError: boolean;
}

/**
 * 이미지 로딩 상태 관리 훅
 *
 * 로딩/에러 상태와 애니메이션 값을 함께 관리합니다.
 */
function useImageLoadState(
  transitionDuration: number,
  onLoadCallback?: () => void,
  onErrorCallback?: (error?: Error) => void,
) {
  const [state, setState] = useState<ImageLoadState>({
    isLoading: true,
    hasError: false,
  });

  const opacity = useSharedValue(0);

  const handleLoad = useCallback(() => {
    setState({ isLoading: false, hasError: false });
    opacity.value = withTiming(1, {
      duration: transitionDuration,
      easing: Easing.out(Easing.ease),
    });
    onLoadCallback?.();
  }, [opacity, transitionDuration, onLoadCallback]);

  const handleError = useCallback(() => {
    setState({ isLoading: false, hasError: true });
    onErrorCallback?.();
  }, [onErrorCallback]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    ...state,
    handleLoad,
    handleError,
    animatedStyle,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * source URL이 유효한지 확인
 */
function isValidSource(source: string): boolean {
  return source.trim().length > 0;
}

/**
 * ContentFit을 RN Image의 resizeMode로 변환
 *
 * TODO: expo-image 전환 시 이 함수는 제거되고 contentFit을 직접 사용
 */
function contentFitToResizeMode(contentFit: ContentFitType): 'cover' | 'contain' | 'stretch' {
  switch (contentFit) {
    case ContentFit.Cover:
      return 'cover';
    case ContentFit.Contain:
      return 'contain';
    case ContentFit.Fill:
      return 'stretch';
    default:
      return 'cover';
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * 기본 설정값
 */
const DEFAULT_CACHE_POLICY = CachePolicy.MemoryDisk;
const DEFAULT_CONTENT_FIT = ContentFit.Cover;
const DEFAULT_TRANSITION_DURATION = 300;
const DEFAULT_BORDER_RADIUS = 4;

function AppImageComponent({
  source,
  width,
  height,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: expo-image 전환 시 활성화
  cachePolicy = DEFAULT_CACHE_POLICY,
  contentFit = DEFAULT_CONTENT_FIT,
  transition = DEFAULT_TRANSITION_DURATION,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: expo-image 전환 시 활성화
  placeholder,
  borderRadius = DEFAULT_BORDER_RADIUS,
  transparent = false,
  style,
  onLoad,
  onError,
}: AppImageProps) {
  const hasValidSource = isValidSource(source);

  const { isLoading, hasError, handleLoad, handleError, animatedStyle } = useImageLoadState(
    transition,
    onLoad,
    onError,
  );

  // 이미지 스타일 메모이제이션
  const imageStyle = useMemo(
    () => ({
      width,
      height,
      position: 'absolute' as const,
      top: 0,
      left: 0,
    }),
    [width, height],
  );

  // source 객체 메모이제이션
  const imageSource = useMemo(() => ({ uri: source }), [source]);

  // resizeMode 변환 (RN Image 전용)
  const resizeMode = contentFitToResizeMode(contentFit);

  // 에러 상태인지 판단 (빈 소스 또는 로드 에러)
  const shouldShowError = hasError || !hasValidSource;

  // 로딩 상태 표시 조건 (transparent 모드에서는 placeholder 숨김)
  const shouldShowPlaceholder = isLoading && hasValidSource && !transparent;

  // 이미지 표시 조건
  const shouldShowImage = !hasError && hasValidSource;

  // TODO: [expo-image 전환 시]
  // 1. Animated.Image를 expo-image의 Image로 교체
  // 2. cachePolicy prop을 직접 전달
  // 3. contentFit prop을 직접 전달 (resizeMode 변환 불필요)
  // 4. placeholder.blurhash를 직접 사용
  // 5. transition prop을 직접 사용
  //
  // 예시:
  // import { Image } from 'expo-image';
  // <Image
  //   source={source}
  //   cachePolicy={cachePolicy}
  //   contentFit={contentFit}
  //   placeholder={{ blurhash: placeholder?.blurhash }}
  //   transition={transition}
  //   style={imageStyle}
  //   onLoad={handleLoad}
  //   onError={handleError}
  // />

  return (
    <Container
      width={width}
      height={height}
      borderRadius={borderRadius}
      transparent={transparent}
      style={style}
    >
      {/* 로딩 중 placeholder */}
      {shouldShowPlaceholder && (
        <PlaceholderView width={width} height={height} borderRadius={borderRadius} />
      )}

      {/* 에러 상태 표시 */}
      {shouldShowError && (
        <ImageErrorPlaceholder width={width} height={height} borderRadius={borderRadius} />
      )}

      {/* 실제 이미지 (현재: RN Animated.Image) */}
      {shouldShowImage && (
        <Animated.Image
          source={imageSource}
          style={[imageStyle, animatedStyle]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.View<{
  width: number;
  height: number;
  borderRadius: number;
  transparent: boolean;
}>(({ width, height, borderRadius, transparent }) => ({
  width,
  height,
  borderRadius,
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: transparent ? 'transparent' : colors.gray05,
}));

const PlaceholderView = styled.View<{
  width: number;
  height: number;
  borderRadius: number;
}>(({ width, height, borderRadius }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width,
  height,
  backgroundColor: colors.gray05,
  borderRadius,
}));

// ============================================================================
// Export (결합도: 명확한 export로 외부 의존성 최소화)
// ============================================================================

/**
 * memo로 감싸서 불필요한 리렌더링 방지
 *
 * 비교 대상:
 * - source: 이미지 URL
 * - width/height: 크기
 * - cachePolicy: 캐싱 정책
 * - contentFit: 맞춤 방식
 * - borderRadius: 모서리 둥글기
 * - transparent: 배경 투명 여부
 */
export const AppImage = memo(AppImageComponent, (prevProps, nextProps) => {
  return (
    prevProps.source === nextProps.source &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.cachePolicy === nextProps.cachePolicy &&
    prevProps.contentFit === nextProps.contentFit &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.transition === nextProps.transition &&
    prevProps.transparent === nextProps.transparent
  );
});
