/**
 * UserActivityStats - 유저 활동 통계
 *
 * 시청기록, 찜, 평점 통계를 표시합니다.
 * 각 항목 클릭 시 해당 목록 페이지로 이동합니다.
 */

import { memo, useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import type { RootStackParamList } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import type { UserDetailModel } from '../_types/userDetailModel';

// SVG 아이콘 상수 (컴포넌트 외부로 최적화)
const PLAY_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 3L19 12L5 21V3Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const HEART_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.84 4.61012C20.3292 4.09912 19.7228 3.69376 19.0554 3.4172C18.3879 3.14064 17.6725 2.99829 16.95 2.99829C16.2275 2.99829 15.5121 3.14064 14.8446 3.4172C14.1772 3.69376 13.5708 4.09912 13.06 4.61012L12 5.67012L10.94 4.61012C9.9083 3.57842 8.50903 2.99883 7.05 2.99883C5.59096 2.99883 4.19169 3.57842 3.16 4.61012C2.1283 5.64181 1.54871 7.04108 1.54871 8.50012C1.54871 9.95915 2.1283 11.3584 3.16 12.3901L4.22 13.4501L12 21.2301L19.78 13.4501L20.84 12.3901C21.351 11.8794 21.7563 11.2729 22.0329 10.6055C22.3095 9.93801 22.4518 9.2226 22.4518 8.50012C22.4518 7.77763 22.3095 7.06222 22.0329 6.39476C21.7563 5.7273 21.351 5.12087 20.84 4.61012Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const STAR_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserActivityStatsProps {
  readonly user: UserDetailModel;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const UserActivityStats = memo(function UserActivityStats({ user }: UserActivityStatsProps) {
  const navigation = useNavigation<NavigationProp>();

  const handleWatchHistoryPress = useCallback(() => {
    navigation.navigate(routePages.adminUserContentList, {
      userId: user.id,
      displayName: user.displayName,
      initialTab: 0, // 시청기록
    });
  }, [navigation, user.id, user.displayName]);

  const handleFavoritesPress = useCallback(() => {
    navigation.navigate(routePages.adminUserContentList, {
      userId: user.id,
      displayName: user.displayName,
      initialTab: 1, // 찜
    });
  }, [navigation, user.id, user.displayName]);

  const handleRatingsPress = useCallback(() => {
    navigation.navigate(routePages.adminUserContentList, {
      userId: user.id,
      displayName: user.displayName,
      initialTab: 2, // 평가
    });
  }, [navigation, user.id, user.displayName]);

  return (
    <Container>
      <SectionTitle>활동 통계</SectionTitle>
      <StatsGrid>
        <StatItemButton onPress={handleWatchHistoryPress} activeOpacity={0.7}>
          <IconContainer>
            <SvgXml xml={PLAY_ICON_SVG} width={24} height={24} />
          </IconContainer>
          <StatValue>{user.watchHistoryCount}</StatValue>
          <StatLabel>시청기록</StatLabel>
        </StatItemButton>
        <StatItemButton onPress={handleFavoritesPress} activeOpacity={0.7}>
          <IconContainer>
            <SvgXml xml={HEART_ICON_SVG} width={24} height={24} />
          </IconContainer>
          <StatValue>{user.favoritesCount}</StatValue>
          <StatLabel>찜한 콘텐츠</StatLabel>
        </StatItemButton>
        <StatItemButton onPress={handleRatingsPress} activeOpacity={0.7}>
          <IconContainer>
            <SvgXml xml={STAR_ICON_SVG} width={24} height={24} />
          </IconContainer>
          <StatValue>{user.ratingsCount}</StatValue>
          <StatLabel>평가한 콘텐츠</StatLabel>
        </StatItemButton>
      </StatsGrid>
    </Container>
  );
});

/* Styled Components */
const Container = styled(View)({
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: colors.black,
  borderTopWidth: 1,
  borderTopColor: colors.gray05,
});

const SectionTitle = styled.Text({
  ...textStyles.title3,
  color: colors.white,
  marginBottom: 16,
});

const StatsGrid = styled(View)({
  flexDirection: 'row',
  gap: 12,
});

const StatItemButton = styled(TouchableOpacity)({
  flex: 1,
  backgroundColor: colors.gray06,
  borderRadius: 12,
  paddingVertical: 16,
  alignItems: 'center',
});

const IconContainer = styled(View)({
  marginBottom: 8,
});

const StatValue = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  marginBottom: 4,
});

const StatLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
});
