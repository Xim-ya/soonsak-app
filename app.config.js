/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();

const GOOGLE_OAUTH_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_OAUTH_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// URL scheme용 - .apps.googleusercontent.com 제거 (undefined 시 null 반환)
const GOOGLE_IOS_URL_SCHEME = GOOGLE_OAUTH_IOS_CLIENT_ID
  ? GOOGLE_OAUTH_IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')
  : null;
const GOOGLE_ANDROID_URL_SCHEME = GOOGLE_OAUTH_ANDROID_CLIENT_ID
  ? GOOGLE_OAUTH_ANDROID_CLIENT_ID.replace('.apps.googleusercontent.com', '')
  : null;
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;
const APP_VARIANT = process.env.APP_VARIANT || 'development';

module.exports = {
  expo: {
    name: '순삭',
    slug: 'soonsak',
    scheme: [
      'soonsak',
      GOOGLE_IOS_URL_SCHEME && `com.googleusercontent.apps.${GOOGLE_IOS_URL_SCHEME}`,
      GOOGLE_ANDROID_URL_SCHEME && `com.googleusercontent.apps.${GOOGLE_ANDROID_URL_SCHEME}`,
    ].filter(Boolean),
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
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
      entitlements: {
        'aps-environment': APP_VARIANT === 'production' ? 'production' : 'development',
      },
      infoPlist: {
        CFBundleName: '순삭',
        CFBundleDisplayName: '순삭',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
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
    ].filter(Boolean),
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
  },
};
