/**
 * AdminUserDetailPage - 어드민 유저 상세 페이지
 *
 * 유저 상세 정보, 역할 변경, 활동 통계, 푸시 토큰, 푸시 발송
 */

import { useCallback } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { BasePage } from '@/presentation/components/page';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { routePages } from '@/shared/navigation/constant/routePages';
import type { RootStackParamList, ScreenRouteProp } from '@/shared/navigation/types';
import {
  UserInfoSection,
  UserRoleSelector,
  UserActivityStats,
  PushTokenStatus,
  PushNotificationSender,
} from './_components';
import { useUserDetail } from './_hooks/useUserDetail';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = ScreenRouteProp<typeof routePages.adminUserDetail>;

// 뒤로가기 아이콘 SVG
const backIconSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export default function AdminUserDetailPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const insets = useSafeAreaInsets();

  const { userId, displayName } = route.params;

  const {
    user,
    isLoading,
    error,
    isUpdatingRole,
    updateRole,
    isSendingPush,
    sendPush,
    refetch,
  } = useUserDetail(userId);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 활성 푸시 토큰 존재 여부
  const hasActiveTokens = (user?.pushTokens ?? []).some((t) => t.isActive);

  // 헤더 타이틀
  const headerTitle = user?.displayName || displayName || '유저 상세';

  return (
    <BasePage useSafeArea={false} automaticallyAdjustKeyboardInsets={false} touchableWithoutFeedback={false}>
      {/* 헤더 */}
      <HeaderContainer paddingTop={insets.top}>
        <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <SvgXml xml={backIconSvg} width={24} height={24} />
        </BackButton>
        <HeaderTitle numberOfLines={1}>{headerTitle}</HeaderTitle>
        <HeaderSpacer />
      </HeaderContainer>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.gray02} />
        </LoadingContainer>
      ) : error || !user ? (
        <ErrorContainer>
          <ErrorText>유저 정보를 불러올 수 없습니다</ErrorText>
          <RetryButton onPress={refetch} activeOpacity={0.7}>
            <RetryButtonText>다시 시도</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.gray02} />
          }
        >
          {/* 기본 정보 */}
          <UserInfoSection user={user} />

          {/* 역할 변경 */}
          <UserRoleSelector
            currentRole={user.role}
            isLoading={isUpdatingRole}
            onRoleChange={updateRole}
          />

          {/* 활동 통계 */}
          <UserActivityStats user={user} />

          {/* 푸시 토큰 상태 */}
          <PushTokenStatus tokens={user.pushTokens} />

          {/* 푸시 발송 */}
          <PushNotificationSender
            hasActiveTokens={hasActiveTokens}
            isLoading={isSendingPush}
            onSend={sendPush}
          />
        </ScrollView>
      )}
    </BasePage>
  );
}

/* Styled Components */
const HeaderContainer = styled.View<{ paddingTop: number }>(({ paddingTop }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: paddingTop + 8,
  paddingBottom: 12,
  paddingHorizontal: 16,
  backgroundColor: colors.black,
}));

const BackButton = styled(TouchableOpacity)({
  padding: 4,
});

const HeaderTitle = styled.Text({
  flex: 1,
  ...textStyles.title1,
  color: colors.white,
  textAlign: 'center',
});

const HeaderSpacer = styled.View({
  width: 32,
});

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const ErrorContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
});

const ErrorText = styled.Text({
  ...textStyles.body2,
  color: colors.gray03,
  marginBottom: 16,
});

const RetryButton = styled(TouchableOpacity)({
  backgroundColor: colors.gray06,
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 8,
});

const RetryButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});
