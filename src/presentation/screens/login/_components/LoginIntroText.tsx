import LoginIntroTextSvg from '@assets/icons/login_intro_text.svg';
import { AppSize } from '@/shared/utils/appSize';

/** SVG 크기 상수 */
const SVG_WIDTH = AppSize.ratioWidth(280);
const SVG_HEIGHT = SVG_WIDTH * 0.3; // 비율 유지

/**
 * LoginIntroText - 로그인 화면 인트로 텍스트 컴포넌트
 *
 * login_intro_text.svg를 화면 상단에 표시합니다.
 * 부모 컴포넌트(LoginPage)에서 paddingHorizontal을 적용합니다.
 *
 * @example
 * <LoginIntroText />
 */
export function LoginIntroText() {
  return <LoginIntroTextSvg width={SVG_WIDTH} height={SVG_HEIGHT} />;
}
