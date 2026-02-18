import { useRef } from 'react';
import { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

/** Fade-in 애니메이션 지속 시간 (ms) */
const FADE_DURATION = 260;

interface FadeInImageProps {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
}

/**
 * 이미지 로드 완료 시 fade-in 애니메이션이 적용되는 Image 컴포넌트
 */
export function FadeInImage({ source, style }: FadeInImageProps) {
  const opacity = useSharedValue(0);
  const isLoadedRef = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleLoad = () => {
    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      opacity.value = withTiming(1, { duration: FADE_DURATION });
    }
  };

  return (
    <Animated.Image
      source={source}
      style={[style, animatedStyle]}
      onLoad={handleLoad}
      resizeMode="cover"
    />
  );
}
