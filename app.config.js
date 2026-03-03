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
const APP_VARIANT = process.env.APP_VARIANT || 'development';
const KOTLIN_VERSION = '2.0.21';

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
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.soonsak.app',
      usesAppleSignIn: true,
      googleServicesFile: './GoogleService-Info.plist',
      entitlements: {
        'aps-environment': APP_VARIANT === 'production' ? 'production' : 'development',
      },
      infoPlist: {
        CFBundleName: '순삭',
        CFBundleDisplayName: '순삭',
        FIRDebugEnabled: true,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
      package: 'com.soonsak.app',
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-web-browser',
      'expo-apple-authentication',
      [
        'expo-build-properties',
        {
          android: {
            kotlinVersion: KOTLIN_VERSION,
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification_icon.png',
          color: '#00C853',
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
