/**
 * Navigation Ref
 *
 * 전역에서 접근 가능한 NavigationContainer ref입니다.
 * App.tsx에서 설정하고, 미들웨어/서비스에서 사용합니다.
 *
 * @example
 * // App.tsx에서 설정
 * <NavigationContainer ref={navigationRef}>
 *
 * // 서비스에서 사용
 * if (navigationRef.isReady()) {
 *   navigationRef.navigate('Screen');
 * }
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
