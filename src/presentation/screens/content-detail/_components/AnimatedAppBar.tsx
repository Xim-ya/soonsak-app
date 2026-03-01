import { BackButtonAppBar } from '@/presentation/components/app-bar';
import { MoreOptionsButton } from '@/presentation/components/button/MoreOptionsButton';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { EdgeInsets } from 'react-native-safe-area-context';

interface AnimatedAppBarProps {
  insets: EdgeInsets;
  opacity: SharedValue<number>;
  title?: string | undefined;
  onMorePress?: (() => void) | undefined;
}

// 최적화된 AnimatedBackButtonAppBar 컴포넌트
const AnimatedAppBar = React.memo<AnimatedAppBarProps>(
  ({ insets, opacity, title, onMorePress }) => {
    // backgroundColor 애니메이션
    const animatedStyle = useAnimatedStyle(() => {
      'worklet';
      return {
        backgroundColor: `rgba(0,0,0,${opacity.value})`,
      };
    }, [opacity]);

    // 제목 opacity 애니메이션 (0.7~1.0 구간에서 fade in)
    const titleAnimatedStyle = useAnimatedStyle(() => {
      'worklet';
      const titleOpacity = interpolate(opacity.value, [0.7, 1], [0, 1], Extrapolation.CLAMP);
      return {
        opacity: titleOpacity,
      };
    }, [opacity]);

    // 스타일 객체 메모이제이션
    const containerStyle = useMemo(
      () => ({
        position: 'absolute' as const,
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 999,
      }),
      [insets.top],
    );

    // 액션 버튼 메모이제이션 (onMorePress가 있을 때만 표시)
    const actions = useMemo(
      () => (onMorePress ? [<MoreOptionsButton key="more" onPress={onMorePress} />] : []),
      [onMorePress],
    );

    return (
      <Animated.View style={[containerStyle, animatedStyle]}>
        <BackButtonAppBar position="relative" backgroundColor="transparent" actions={actions} />
        {title && (
          <View style={styles.titleContainer} pointerEvents="none">
            <Animated.Text style={[styles.title, titleAnimatedStyle]} numberOfLines={1}>
              {title}
            </Animated.Text>
          </View>
        )}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  titleContainer: {
    position: 'absolute',
    left: 56,
    right: 56,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...textStyles.body3,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
});

AnimatedAppBar.displayName = 'AnimatedAppBar';

export { AnimatedAppBar };
export type { AnimatedAppBarProps };
