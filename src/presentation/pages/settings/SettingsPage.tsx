/**
 * SettingsPage - 설정 화면
 *
 * 앱 설정 및 계정 관리 화면입니다.
 * - 알림 설정
 * - 앱 정보 (버전, 피드백, 약관)
 * - 계정 관리 (로그아웃, 회원탈퇴)
 */

import { useCallback, useState } from 'react';
import { ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import colors from '@/shared/styles/colors';
import { AppSize } from '@/shared/utils/appSize';
import { useAuth } from '@/shared/providers/AuthProvider';
import { authApi } from '@/features/auth/api/authApi';
import { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { SettingsSection, SettingsItem, SettingsToggleItem } from './_components';
import { AdminOnly } from '@/features/auth/guards';

// TODO: react-native-device-info로 실제 버전 가져오기
const APP_VERSION = '1.0.0';

// TODO: 실제 URL로 교체
const FEEDBACK_URL = 'mailto:support@soonsak.app';
const PRIVACY_URL = 'https://soonsak.app/privacy';
const APP_STORE_URL = 'https://apps.apple.com/app/soonsak';

// 회원탈퇴 텍스트 색상 (연한 흰색)
const WITHDRAW_TEXT_COLOR = colors.gray02;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsPage() {
  const navigation = useNavigation<NavigationProp>();
  const { signOut, status } = useAuth();
  const isLoggedIn = status === 'authenticated';

  // TODO: 실제 알림 설정 상태 연동 (AsyncStorage 또는 서버)
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 로그인 화면으로 네비게이션 리셋
  const resetToLoginScreen = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: routePages.login }],
    });
  }, [navigation]);

  // 알림 설정 변경 핸들러
  const handleNotificationToggle = useCallback((value: boolean) => {
    setIsNotificationEnabled(value);
    // TODO: 알림 설정 저장 로직 구현
  }, []);

  // 외부 URL 열기 공통 핸들러
  const openExternalUrl = useCallback((url: string, errorMessage: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('오류', errorMessage);
    });
  }, []);

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      resetToLoginScreen();
    } catch {
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  }, [signOut, resetToLoginScreen]);

  // 로그아웃 확인 다이얼로그
  const handleLogoutPress = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: handleLogout,
      },
    ]);
  }, [handleLogout]);

  // 회원탈퇴 처리
  const handleWithdraw = useCallback(async () => {
    if (isWithdrawing) return;

    setIsWithdrawing(true);
    try {
      await authApi.withdrawUser();
      resetToLoginScreen();
    } catch {
      Alert.alert('오류', '회원탈퇴 처리 중 문제가 발생했습니다.');
    } finally {
      setIsWithdrawing(false);
    }
  }, [isWithdrawing, resetToLoginScreen]);

  // 회원탈퇴 확인 다이얼로그
  const handleWithdrawPress = useCallback(() => {
    Alert.alert(
      '회원탈퇴',
      '정말 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: handleWithdraw,
        },
      ],
    );
  }, [handleWithdraw]);

  return (
    <BasePage>
      <Container>
        <BackButtonAppBar title="설정" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={SCROLL_CONTENT_STYLE}
        >
          {/* 설정 섹션 */}
          <SettingsSection>
            <SettingsToggleItem
              label="알림 활성화"
              description="주요 공지, 기능 업데이트 등 알림"
              value={isNotificationEnabled}
              onValueChange={handleNotificationToggle}
            />
            <Divider />
            <SettingsItem label={`현재 버전 ${APP_VERSION}`} showArrow={false} />
            <Divider />
            <SettingsItem
              label="피드백 및 문의사항"
              onPress={() => openExternalUrl(FEEDBACK_URL, '메일 앱을 열 수 없습니다.')}
            />
            <Divider />
            <SettingsItem
              label="개인정보 및 약관"
              onPress={() => openExternalUrl(PRIVACY_URL, '페이지를 열 수 없습니다.')}
            />
            <Divider />
            <SettingsItem
              label="앱 평가하기"
              onPress={() => openExternalUrl(APP_STORE_URL, '스토어를 열 수 없습니다.')}
            />
          </SettingsSection>

          {/* 기타 섹션 - 로그인 유저에게만 표시 */}
          {isLoggedIn && (
            <SettingsSection title="기타">
              <SettingsItem label="로그아웃" onPress={handleLogoutPress} />
              <Divider />
              <SettingsItem
                label="회원탈퇴"
                labelColor={WITHDRAW_TEXT_COLOR}
                onPress={handleWithdrawPress}
              />
            </SettingsSection>
          )}

          {/* 관리자 섹션 - 어드민에게만 표시 */}
          <AdminOnly>
            <SettingsSection title="관리자">
              <SettingsItem
                label="비디오 처리"
                onPress={() => navigation.navigate(routePages.adminVideoManagement)}
              />
            </SettingsSection>
          </AdminOnly>
        </ScrollView>

        {/* 회원탈퇴 로딩 오버레이 */}
        {isWithdrawing && (
          <LoadingOverlay>
            <ActivityIndicator size="large" color={colors.white} />
          </LoadingOverlay>
        )}
      </Container>
    </BasePage>
  );
}

/* Styles */

const SCROLL_CONTENT_STYLE = {
  paddingTop: AppSize.ratioHeight(16),
  paddingBottom: AppSize.ratioHeight(40),
};

const Container = styled.View({
  flex: 1,
  backgroundColor: colors.black,
});

const Divider = styled.View({
  height: 1,
  backgroundColor: colors.gray05,
  marginHorizontal: AppSize.ratioWidth(16),
});

const LoadingOverlay = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
});
