/**
 * LoadableImageView - 로딩 상태와 에러 처리가 포함된 이미지 컴포넌트
 *
 * 비디오 썸네일, 포스터 이미지 등 네트워크 이미지를 표시할 때 사용합니다.
 * 이미지 로딩 중에는 placeholder를 표시하고, 로딩 완료 후 부드러운 애니메이션과 함께 이미지를 노출합니다.
 * 이미지 로딩 실패 시에는 에러 상태를 명확히 표시합니다.
 *
 * @example
 * <LoadableImageView
 *   source="https://example.com/image.jpg"
 *   width={196}
 *   height={110}
 *   borderRadius={8}
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

interface LoadableImageViewProps {
  source: string;
  width: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function LoadableImageViewComponent({
  source,
  width,
  height,
  borderRadius = 4,
  style,
}: LoadableImageViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // source가 빈 문자열이면 에러 상태로 처리
  const isValidSource = source && source.length > 0;

  // Reanimated shared value (UI 스레드에서 애니메이션)
  const opacity = useSharedValue(0);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);

    // Reanimated 애니메이션 (UI 스레드에서 실행)
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity]);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // 애니메이션 스타일 (UI 스레드)
  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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

  return (
    <Container width={width} height={height} borderRadius={borderRadius} style={style}>
      {/* 로딩 중일 때 회색 placeholder (유효한 소스일 때만) */}
      {isLoading && isValidSource && (
        <PlaceholderView width={width} height={height} borderRadius={borderRadius} />
      )}

      {/* 에러 시 에러 표시 (빈 소스 포함) */}
      {(hasError || !isValidSource) && (
        <ImageErrorPlaceholder width={width} height={height} borderRadius={borderRadius} />
      )}

      {/* 실제 이미지 - Reanimated 애니메이션 */}
      {!hasError && isValidSource && (
        <Animated.Image
          source={imageSource}
          style={[imageStyle, animatedImageStyle]}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </Container>
  );
}

/* Styled Components */
const Container = styled.View<{
  width: number;
  height: number;
  borderRadius: number;
}>(({ width, height, borderRadius }) => ({
  width,
  height,
  borderRadius,
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: colors.gray05,
}));

// 로딩 중 placeholder
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


// memo로 감싸서 source가 같으면 리렌더링 방지
const LoadableImageView = memo(LoadableImageViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.source === nextProps.source &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.borderRadius === nextProps.borderRadius
  );
});

export { LoadableImageView };
