import React, { useCallback } from 'react';
import { Pressable, Image } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import colors from '@/shared/styles/colors';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import SearchIcon from '@assets/icons/search_tab.svg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoImage = require('@assets/images/logo.png');

/** 스크롤 임계값 (Flutter 스펙: 390px) */
const SCROLL_THRESHOLD = 390;

/** 로고 크기 (이미지 자체에 여백 포함) */
const LOGO_SIZE = 44;

/** 검색 아이콘 크기 (viewBox: 28, 실제 아이콘: ~18) */
const SEARCH_ICON_SIZE = 28;

interface HomeAppBarProps {
  scrollY: SharedValue<number>;
}

/**
 * 홈 화면 상단 앱바
 * - 좌측: 로고
 * - 우측: 검색 버튼
 * - 스크롤 390px 이상 시 fade out
 */
function HomeAppBar({ scrollY }: HomeAppBarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSearchPress = useCallback(() => {
    navigation.navigate(routePages.search);
  }, [navigation]);

  // 스크롤에 따른 opacity 애니메이션
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_THRESHOLD - 100, SCROLL_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return { opacity };
  });

  return (
    <Container style={{ paddingTop: insets.top }}>
      <AnimatedContent style={animatedStyle}>
        <LogoImage source={logoImage} resizeMode="contain" />
        <SearchButton onPress={handleSearchPress} hitSlop={12} accessibilityLabel="검색">
          <SearchIcon width={SEARCH_ICON_SIZE} height={SEARCH_ICON_SIZE} color={colors.white} />
        </SearchButton>
      </AnimatedContent>
    </Container>
  );
}

export default React.memo(HomeAppBar);

/* Styled Components */

const Container = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  paddingHorizontal: 16,
});

const AnimatedContent = Animated.createAnimatedComponent(
  styled.View({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
);

const LogoImage = styled(Image)({
  width: LOGO_SIZE,
  height: LOGO_SIZE,
});

const SearchButton = styled(Pressable)({
  padding: 4,
});
