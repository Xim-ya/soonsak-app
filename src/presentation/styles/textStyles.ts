// src/shared/styles/appTextStyle.ts

import { TextStyle } from 'react-native';
import colors from './colors';

const pretendard = {
  bold: 'Pretendard-Bold',
  semiBold: 'Pretendard-SemiBold',
  medium: 'Pretendard-Medium',
  regular: 'Pretendard-Regular',
  staatliches: 'staatliches_regular',
} as const;

interface AppTextStyles {
  extraFont: TextStyle;
  web1: TextStyle;
  web2: TextStyle;
  web3: TextStyle;
  highlight: TextStyle;
  headline3: TextStyle;
  headline2: TextStyle;
  headline1: TextStyle;
  title3: TextStyle;
  title3Bold: TextStyle;
  title2: TextStyle;
  title1: TextStyle;
  body3: TextStyle;
  body2: TextStyle;
  body1: TextStyle;
  alert1: TextStyle;
  alert2: TextStyle;
  desc: TextStyle;
  nav: TextStyle;
}

const appTextStyle: AppTextStyles = {
  extraFont: {
    fontFamily: pretendard.staatliches,
    fontSize: 24,
    color: colors.white,
  },
  web1: {
    fontFamily: pretendard.bold,
    fontSize: 40,
    lineHeight: 52,
    letterSpacing: -0.2,
    color: colors.white,
  },
  web2: {
    fontFamily: pretendard.bold,
    fontSize: 36,
    lineHeight: 46,
    letterSpacing: -0.2,
    color: colors.white,
  },
  web3: {
    fontFamily: pretendard.bold,
    fontSize: 32,
    lineHeight: 48,
    letterSpacing: -0.2,
    color: colors.white,
  },
  highlight: {
    fontFamily: pretendard.bold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.2,
    color: colors.white,
  },
  headline3: {
    fontFamily: pretendard.semiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.white,
  },
  headline2: {
    fontFamily: pretendard.bold,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: -0.2,
    color: colors.white,
  },
  headline1: {
    fontFamily: pretendard.bold,
    fontSize: 24,
    lineHeight: 37,
    letterSpacing: -0.2,
    color: colors.white,
  },
  title3: {
    fontFamily: pretendard.bold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.white,
  },
  title3Bold: {
    fontFamily: pretendard.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  title2: {
    fontFamily: pretendard.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.white,
  },
  title1: {
    fontFamily: pretendard.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.white,
  },
  body3: {
    fontFamily: pretendard.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: colors.white,
  },
  body2: {
    fontFamily: pretendard.medium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.white,
  },
  body1: {
    fontFamily: pretendard.semiBold,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.white,
  },
  alert1: {
    fontFamily: pretendard.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: colors.white,
  },
  alert2: {
    fontFamily: pretendard.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: colors.white,
  },
  desc: {
    fontFamily: pretendard.regular,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: -0.2,
    color: colors.white,
  },
  nav: {
    fontFamily: pretendard.medium,
    fontSize: 12,
    letterSpacing: -0.2,
    color: colors.white,
  },
};

export default appTextStyle;
export type { AppTextStyles };
