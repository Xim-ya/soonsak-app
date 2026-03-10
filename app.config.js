/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();

const GOOGLE_OAUTH_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_OAUTH_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

// URL scheme용 - .apps.googleusercontent.com 제거 (undefined 시 null 반환)
const GOOGLE_IOS_URL_SCHEME = GOOGLE_OAUTH_IOS_CLIENT_ID
  ? GOOGLE_OAUTH_IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')
  : null;
const GOOGLE_ANDROID_URL_SCHEME = GOOGLE_OAUTH_ANDROID_CLIENT_ID
  ? GOOGLE_OAUTH_ANDROID_CLIENT_ID.replace('.apps.googleusercontent.com', '')
  : null;
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;

// EAS 빌드 시 APP_VARIANT가 설정되지 않으면 EAS_BUILD_PROFILE에서 파생
const APP_VARIANT =
  process.env.APP_VARIANT ||
  (process.env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development');

// EAS_PROJECT_ID가 없으면 경고 출력
if (!EAS_PROJECT_ID) {
  console.warn('[app.config.js] EAS_PROJECT_ID is not set. Expo Updates (OTA) will be disabled.');
}
const KOTLIN_VERSION = '2.1.20';
const KSP_VERSION = '2.1.20-1.0.29';

module.exports = {
  expo: {
    name: '순삭',
    slug: 'soonsak',
    scheme: [
      'soonsak',
      GOOGLE_IOS_URL_SCHEME && `com.googleusercontent.apps.${GOOGLE_IOS_URL_SCHEME}`,
      GOOGLE_ANDROID_URL_SCHEME && `com.googleusercontent.apps.${GOOGLE_ANDROID_URL_SCHEME}`,
      KAKAO_NATIVE_APP_KEY && `kakao${KAKAO_NATIVE_APP_KEY}`,
    ].filter(Boolean),
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    // EAS_PROJECT_ID가 있을 때만 OTA 업데이트 활성화
    ...(EAS_PROJECT_ID && {
      updates: {
        enabled: true,
        url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
        fallbackToCacheTimeout: 0,
        checkAutomatically: 'ON_LOAD',
      },
    }),
    runtimeVersion: {
      policy: 'appVersion',
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.soonsak.app',
      usesAppleSignIn: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || './GoogleService-Info.plist',
      entitlements: {
        'aps-environment': APP_VARIANT === 'production' ? 'production' : 'development',
      },
      infoPlist: {
        CFBundleName: '순삭',
        CFBundleDisplayName: '순삭',
        CFBundleDevelopmentRegion: 'ko',
        NSUserNotificationsUsageDescription: '취향에 딱 맞는 작품이 올라오면 가장 먼저 알려드릴게요',
        ITSAppUsesNonExemptEncryption: false,
        ...(APP_VARIANT !== 'production' && { FIRDebugEnabled: true }),
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
      package: 'com.soonsak.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-web-browser',
      'expo-apple-authentication',
      [
        'expo-image-picker',
        {
          photosPermission: '앨범에서 프로필 사진을 선택할 수 있어요',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            kotlinVersion: KOTLIN_VERSION,
            kspVersion: KSP_VERSION,
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification_icon.png',
          color: '#000000',
          defaultChannel: 'default',
        },
      ],
      GOOGLE_IOS_URL_SCHEME && [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: `com.googleusercontent.apps.${GOOGLE_IOS_URL_SCHEME}`,
        },
      ],
      KAKAO_NATIVE_APP_KEY && [
        '@react-native-seoul/kakao-login',
        {
          kakaoAppKey: KAKAO_NATIVE_APP_KEY,
          kotlinVersion: KOTLIN_VERSION,
        },
      ],
      './plugins/withKakaoMaven',
      './plugins/withDebugKeystore',
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      './plugins/withFirebaseModularHeaders',
      './plugins/withFirebaseAnalyticsDebugView',
    ].filter(Boolean),
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
  },
};
