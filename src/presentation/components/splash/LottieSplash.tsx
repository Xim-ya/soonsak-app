import styled from '@emotion/native';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';
import colors from '@/presentation/styles/colors';
import { AppSize } from '@/presentation/utils/appSize';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const splashLottie = require('@assets/lottie/splash_logo.json');

/** Lottie 애니메이션 원본 크기 (디자인 기준) */
const LOTTIE_WIDTH = 133;
const LOTTIE_HEIGHT = 89;

/**
 * LottieSplash - 앱 시작 시 표시되는 Lottie 스플래시 화면
 *
 * 네이티브 스플래시 이후 2.5초간 로티 애니메이션을 표시합니다.
 * 이 동안 앱 프리로드(배너 이미지 등)가 병렬로 실행됩니다.
 *
 * @example
 * if (showLottieSplash) {
 *   return <LottieSplash />;
 * }
 */
export function LottieSplash() {
  return (
    <Container>
      <StatusBar style="light" />
      <StyledLottieView source={splashLottie} autoPlay loop={false} />
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
  justifyContent: 'center',
  alignItems: 'center',
});

const StyledLottieView = styled(LottieView)({
  width: AppSize.ratioWidth(LOTTIE_WIDTH),
  height: AppSize.ratioHeight(LOTTIE_HEIGHT),
});
