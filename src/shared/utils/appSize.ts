import { Dimensions, Platform, StatusBar } from 'react-native';

/**
 *  - 앱에서 필요한 디바이스 사이즈 관련 인스턴스들을 초기화하고 필요한 데이터 생성하는 모듈
 *  - 중복된 Dimensions 인스턴스 생성을 방지할 수 있는 이점 있음.
 *  - App.tsx 또는 루트 컴포넌트에서 초기화함.
 *
 *  iOS WKWebView 전체화면 버그 대응:
 *  - iOS에서 WKWebView(YouTube 전체화면 등) 진입/해제 시 Dimensions.get('window')가
 *    landscape 값을 반환하는 WebKit 버그가 있음 (issue #170595, #1872)
 *  - Dimensions.get('screen')은 항상 정확한 값을 반환
 *  - 글로벌 패치: Dimensions.get('window') 호출 시 손상 감지되면 screen 값으로 대체
 *    → 서드파티 라이브러리(collapsible-tab-view, useWindowDimensions 등)까지 보호
 */

class SizeConfig {
  private static instance: SizeConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dimensionsSubscription: any;

  statusBarHeight: number = 0; // Safe Area 상단 Inset
  bottomInset: number = 0; // Safe Area 하단 Inset
  screenWidth: number; // 디바이스 넓이
  screenHeight: number; // 디바이스 높이
  responsiveBottomInset: number = 0; // 반응형 하단 Safe Area 하단 Inset
  isTablet: boolean = false;

  private constructor() {
    // iOS 전역 Dimensions.get('window') 보호 패치 (서드파티 라이브러리 포함 전체 적용)
    if (Platform.OS === 'ios') {
      this.patchDimensionsForIOS();
    }

    const { width, height } = this.getSafeDimensions();
    this.isTablet = width > 600;
    this.screenWidth = this.isTablet ? 375 : width;
    this.screenHeight = this.isTablet ? 812 : height;

    this.dimensionsSubscription = Dimensions.addEventListener(
      'change',
      this.handleDimensionsChange,
    );
  }

  /**
   * iOS 전역 패치: Dimensions API의 두 가지 경로 모두 보호
   *
   * 1) Dimensions.get('window') 직접 호출 → 손상 시 screen 값으로 대체
   * 2) Dimensions.addEventListener('change') 콜백 → 손상된 window 값을 screen으로 교정
   *
   * 2번이 핵심: useWindowDimensions() 훅은 addEventListener 콜백으로 값을 받으므로,
   * get()만 패치하면 react-native-collapsible-tab-view 등 라이브러리가 여전히
   * 손상된 값을 받게 됨. addEventListener 콜백도 패치해야 완전히 보호됨.
   */
  private patchDimensionsForIOS(): void {
    const originalGet = Dimensions.get.bind(Dimensions);
    const originalAddEventListener = Dimensions.addEventListener.bind(Dimensions);

    // 패치 1: Dimensions.get('window') 직접 호출 보호
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Dimensions as any).get = (dim: 'window' | 'screen') => {
      const result = originalGet(dim);

      if (dim === 'window' && result.width > result.height) {
        const screenResult = originalGet('screen');
        if (screenResult.width < screenResult.height) {
          return { ...screenResult };
        }
      }

      return result;
    };

    // 패치 2: addEventListener('change') 콜백 보호
    // useWindowDimensions() 내부 및 서드파티 라이브러리의 change 리스너까지 보호
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Dimensions as any).addEventListener = (type: 'change', handler: (...args: any[]) => void) => {
      if (type === 'change') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safeHandler = (dims: { window: any; screen: any }) => {
          let safeWindow = dims.window;
          if (dims.window.width > dims.window.height && dims.screen.width < dims.screen.height) {
            safeWindow = { ...dims.screen };
          }
          handler({ window: safeWindow, screen: dims.screen });
        };
        return originalAddEventListener(type, safeHandler);
      }
      return originalAddEventListener(type, handler);
    };
  }

  /**
   * iOS WKWebView 전체화면 버그에 안전한 Dimensions 조회
   * - iOS: Dimensions.get('screen') 사용 (WKWebView 버그에 면역)
   * - Android: Dimensions.get('window') 사용 (screen은 상태바 포함하므로 부정확)
   */
  private getSafeDimensions(): { width: number; height: number } {
    if (Platform.OS === 'ios') {
      return Dimensions.get('screen');
    }
    return Dimensions.get('window');
  }

  // 싱글톤 인스턴스 접근
  static get to(): SizeConfig {
    if (!SizeConfig.instance) {
      SizeConfig.instance = new SizeConfig();
    }
    return SizeConfig.instance;
  }

  // 비율로 처리했을 때 높이 넓이. (375 * 812) 기준
  ratioHeight(givenHeight: number): number {
    return (givenHeight / 812) * this.screenHeight;
  }

  ratioWidth(givenWidth: number): number {
    return (givenWidth / 375) * this.screenWidth;
  }

  // SafeArea 업데이트 메서드 (SafeAreaInsets를 받아서 업데이트)
  updateSafeArea(safeAreaInsets?: { top: number; bottom: number }): void {
    // 상태바 높이 설정
    this.statusBarHeight = Platform.select({
      ios: safeAreaInsets?.top || 0,
      android: StatusBar.currentHeight || 0,
      default: 0,
    });

    // 하단 인셋 설정
    this.bottomInset = safeAreaInsets?.bottom || 0;

    // 반응형 하단 인셋 설정
    this.responsiveBottomInset = this.bottomInset === 0 ? 16 : this.bottomInset;
  }

  // 기존 init 메서드는 하위 호환성을 위해 유지
  init(safeAreaInsets?: { top: number; bottom: number }): void {
    this.updateSafeArea(safeAreaInsets);
  }

  /**
   * Dimensions 변경 핸들러
   * iOS: screen 값 사용 (window는 WKWebView 전체화면 버그로 손상 가능)
   * 추가 안전장치: portrait 모드에서 width > height인 경우 무시
   */
  private handleDimensionsChange = ({
    window,
    screen,
  }: {
    window: { width: number; height: number };
    screen: { width: number; height: number };
  }) => {
    const { width, height } = Platform.OS === 'ios' ? screen : window;

    // Portrait 앱에서 width > height이면 비정상 → 무시
    if (width > height) return;

    this.isTablet = width > 600;
    this.screenWidth = this.isTablet ? 375 : width;
    this.screenHeight = this.isTablet ? 812 : height;
  };

  /**
   * 강제 Dimensions 갱신 (PlayerPage 복귀 시 등에서 호출)
   * getSafeDimensions로 정확한 값을 다시 읽어옴
   */
  forceRefreshDimensions(): void {
    const { width, height } = this.getSafeDimensions();
    if (width > height) return;
    this.isTablet = width > 600;
    this.screenWidth = this.isTablet ? 375 : width;
    this.screenHeight = this.isTablet ? 812 : height;
  }

  // 정리 메서드
  destroy(): void {
    this.dimensionsSubscription?.remove();
  }
}

export default SizeConfig;

// 편의를 위한 익스포트
export const AppSize = SizeConfig.to;
