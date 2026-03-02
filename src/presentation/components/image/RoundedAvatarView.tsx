import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/native';
import { Animated } from 'react-native';
import colors from '@/shared/styles/colors';
import LogoPlaceholderIcon from '@assets/icons/logo_placeholder.svg';

interface RoundedAvatorViewProps {
  source: string;
  size: number;
}

/**
 * 아바타 크기에 맞는 로고 아이콘 사이즈 계산
 * size가 작을 경우 아이콘이 컨테이너를 넘지 않도록 제한
 */
function calculateLogoSize(size: number): { width: number; height: number } {
  // 아이콘 너비: 최소 16, 최대 32, 기본 size의 50%
  // 단, size보다 크지 않도록 제한 (작은 아바타에서 오버플로우 방지)
  const baseWidth = Math.max(16, Math.min(size * 0.5, 32));
  const iconWidth = Math.min(size * 0.8, baseWidth); // 컨테이너의 80% 이하로 제한
  const iconHeight = iconWidth * 0.67; // logo_placeholder.svg 비율 (200:134)
  return { width: iconWidth, height: iconHeight };
}

function RoundedAvatorView({ source, size }: RoundedAvatorViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // source가 변경되면 상태 리셋 (에러 상태에서 새 URL로 재시도 가능하도록)
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    fadeAnim.setValue(0);
  }, [source, fadeAnim]);

  // source가 유효한 URL인지 확인
  const hasValidSource = source && source.trim() !== '';

  // 로고 플레이스홀더 표시 여부: URL이 없거나 에러 발생 시
  const shouldShowPlaceholder = !hasValidSource || hasError;

  // 로고 아이콘 크기 계산
  const logoSize = calculateLogoSize(size);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);

    // 부드러운 fade-in 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Container size={size}>
      {/* 로딩 중일 때 회색 placeholder */}
      {isLoading && hasValidSource && !hasError && <PlaceholderView size={size} />}

      {/* URL이 없거나 에러 시 순삭 로고 표시 */}
      {shouldShowPlaceholder && (
        <LogoPlaceholderContainer size={size}>
          <LogoPlaceholderIcon
            width={logoSize.width}
            height={logoSize.height}
            color={colors.gray03}
          />
        </LogoPlaceholderContainer>
      )}

      {/* 실제 이미지 - 유효한 URL이 있을 때만 렌더링 */}
      {hasValidSource && !hasError && (
        <AnimatedAvatar
          source={{ uri: source }}
          size={size}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            opacity: fadeAnim,
          }}
        />
      )}
    </Container>
  );
}

/* Styled Components */
const Container = styled.View<{ size: number }>(({ size }) => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  overflow: 'hidden',
  position: 'relative',
}));

// 로딩 중 회색 placeholder
const PlaceholderView = styled.View<{ size: number }>(({ size }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: size,
  height: size,
  backgroundColor: colors.gray05,
  borderRadius: size / 2,
}));

// 순삭 로고 플레이스홀더 컨테이너
const LogoPlaceholderContainer = styled.View<{ size: number }>(({ size }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: size,
  height: size,
  backgroundColor: colors.gray05,
  borderRadius: size / 2,
  justifyContent: 'center',
  alignItems: 'center',
}));

// 애니메이션이 적용된 이미지
const AnimatedAvatar = styled(Animated.Image)<{ size: number }>(({ size }) => ({
  width: size,
  height: size,
  position: 'absolute',
  top: 0,
  left: 0,
}));

export { RoundedAvatorView };
