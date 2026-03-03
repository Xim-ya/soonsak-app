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

import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import styled from '@emotion/native';
import { ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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
  const [hasError, setHasError] = useState(false);

  // source가 빈 문자열이면 에러 상태로 처리
  const isValidSource = source && source.length > 0;

  // FlashList 셀 재활용 시 source 변경 감지하여 에러 상태 리셋
  const prevSourceRef = useRef(source);
  if (prevSourceRef.current !== source) {
    prevSourceRef.current = source;
    if (hasError) {
      setHasError(false);
    }
  }

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  // 이미지 스타일 메모이제이션 (컨테이너를 완전히 채움)
  const imageStyle = useMemo(
    () => ({
      width,
      height,
      borderRadius,
      position: 'absolute' as const,
      top: 0,
      left: 0,
    }),
    [width, height, borderRadius],
  );

  return (
    <Container width={width} height={height} borderRadius={borderRadius} style={style}>
      {/* 에러 시 에러 표시 (빈 소스 포함) */}
      {(hasError || !isValidSource) && (
        <ImageErrorPlaceholder width={width} height={height} borderRadius={borderRadius} />
      )}

      {/* expo-image: 네이티브 레벨에서 로딩/트랜지션/캐싱 처리 */}
      {/* recyclingKey: FlashList 셀 재활용 시 이전 이미지 즉시 클리어 */}
      {!hasError && isValidSource && (
        <ExpoImage
          source={source}
          style={imageStyle}
          contentFit="cover"
          transition={300}
          recyclingKey={source}
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
