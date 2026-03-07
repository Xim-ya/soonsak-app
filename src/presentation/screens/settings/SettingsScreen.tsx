/**
 * SettingsScreen - 설정 화면
 *
 * 앱 설정 및 계정 관리 화면입니다.
 * - 알림 설정
 * - 앱 정보 (버전, 피드백, 약관)
 * - 계정 관리 (로그아웃, 회원탈퇴)
 */

import { ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { BasePage } from '@/presentation/components/page/BasePage';
import { BackButtonAppBar } from '@/presentation/components/app-bar/BackButtonAppBar';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { AppSize } from '@/presentation/utils/appSize';
import { routePages } from '@/presentation/navigation/constant/routePages';
import { SettingsSection, SettingsItem, SettingsToggleItem } from './_components';
import { AdminOnly } from '@/features/auth/guards';
import { useSettingsAuth } from './_hooks';
import { useAppVersionInfo } from '@/features/app-config';

// 회원탈퇴 텍스트 색상 (연한 흰색)
const WITHDRAW_TEXT_COLOR = colors.gray02;

export default function SettingsScreen() {
  const {
    isLoggedIn,
    isWithdrawing,
    isNotificationEnabled,
    handleNotificationToggle,
    handleLogoutPress,
    handleWithdrawPress,
    openFeedbackUrl,
    openPrivacyUrl,
    openAppStoreUrl,
    navigateToAdmin,
  } = useSettingsAuth();

  const { currentVersion, hasUpdate, openStore } = useAppVersionInfo();

  return (
    <BasePage safeAreaBottom={false}>
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
            <SettingsItem
              label={`현재 버전 ${currentVersion}`}
              showArrow={false}
              rightElement={
                hasUpdate ? (
                  <UpdateButton onPress={openStore} activeOpacity={0.7}>
                    <UpdateButtonText>업데이트</UpdateButtonText>
                  </UpdateButton>
                ) : undefined
              }
            />
            <Divider />
            <SettingsItem label="피드백 및 문의사항" onPress={openFeedbackUrl} />
            <Divider />
            <SettingsItem label="개인정보 및 약관" onPress={openPrivacyUrl} />
            <Divider />
            <SettingsItem label="앱 평가하기" onPress={openAppStoreUrl} />
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
                label="콘텐츠 등록"
                onPress={() => navigateToAdmin(routePages.adminContentRegistration)}
              />
              <Divider />
              <SettingsItem
                label="비디오 처리"
                onPress={() => navigateToAdmin(routePages.adminVideoManagement)}
              />
              <Divider />
              <SettingsItem
                label="유저 관리"
                onPress={() => navigateToAdmin(routePages.adminUserManagement)}
              />
              <Divider />
              <SettingsItem
                label="채널 관리"
                onPress={() => navigateToAdmin(routePages.adminChannelManagement)}
              />
              <Divider />
              <SettingsItem
                label="푸시 관리"
                onPress={() => navigateToAdmin(routePages.adminPushManagement)}
              />
              <Divider />
              <SettingsItem
                label="앱 버전 관리"
                onPress={() => navigateToAdmin(routePages.adminVersionManagement)}
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

/* Styled Components */

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

const UpdateButton = styled(TouchableOpacity)({
  backgroundColor: colors.primary,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
});

const UpdateButtonText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
});
