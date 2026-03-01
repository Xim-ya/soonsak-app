import styled from '@emotion/native';
import { ImageBackground, Dimensions, type ImageSourcePropType } from 'react-native';
import {
  DarkedLinearShadow,
  LinearAlign,
} from '@/presentation/components/shadow/DarkedLinearShadow';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** 그래디언트 높이 (화면 높이의 40%) */
const GRADIENT_HEIGHT = SCREEN_HEIGHT * 0.4;

/** 배경 이미지 소스 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGIN_BACKGROUND_IMAGE: ImageSourcePropType = require('../../../../../assets/images/login.png');

/**
 * LoginBackground - 로그인 화면 배경 컴포넌트
 *
 * login.png 이미지를 전체 화면에 표시하고,
 * 상단과 하단에 검은색 그래디언트를 오버레이합니다.
 *
 * @example
 * <LoginBackground />
 */
export function LoginBackground() {
  return (
    <BackgroundImage source={LOGIN_BACKGROUND_IMAGE} resizeMode="cover">
      {/* 상단 그래디언트 (위에서 진하게 → 아래로 연하게) */}
      <DarkedLinearShadow height={GRADIENT_HEIGHT} align={LinearAlign.topBottom} />

      {/* 하단 그래디언트 (아래에서 진하게 → 위로 연하게) */}
      <DarkedLinearShadow height={GRADIENT_HEIGHT} align={LinearAlign.bottomTop} />
    </BackgroundImage>
  );
}

/* Styled Components */

const BackgroundImage = styled(ImageBackground)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});
