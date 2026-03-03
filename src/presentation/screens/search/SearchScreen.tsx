import { useCallback, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import Gap from '@/presentation/components/view/Gap';
import { BasePage } from '@/presentation/components/page';
import colors from '@/shared/styles/colors';
import { analyticsService } from '@/shared/analytics';
import type { RootStackParamList } from '@/shared/navigation/types';
import { SearchProvider } from './_provider/SearchProvider';
import { SearchBar } from './_components/SearchBar';
import { SearchResultList } from './_components/SearchResultList';

/** 앱바 상수 */
const APPBAR_HEIGHT = 56;
const ICON_SIZE = 24;
const HORIZONTAL_PADDING = 16;

/** 뒤로가기 아이콘 SVG */
const backArrowSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.1351 22.6217L8.50507 14.0001L16.1351 5.37842L17.2201 6.34675L10.4417 14.0001L17.2201 21.6534L16.1351 22.6217Z" fill="${colors.white}"/>
</svg>
`;

/**
 * SearchScreen - 검색 화면 메인 컴포넌트
 *
 * TMDB 키워드 검색 후 Supabase에 등록된 콘텐츠만 필터링하여 표시합니다.
 *
 * @example
 * // Navigation에서 사용
 * navigation.navigate(routePages.search);
 */
export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();

  // search_start 이벤트 로깅 (화면 진입 시)
  useEffect(() => {
    const source = route.params?.source ?? 'unknown';
    analyticsService.searchStart({ source });
  }, [route.params?.source]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SearchProvider>
      <BasePage>
        <Container>
          {/* 앱바: 뒤로가기 버튼 + 검색바 */}
          <AppBarContainer>
            <BackButton
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="뒤로가기"
            >
              <SvgXml xml={backArrowSvg} width={ICON_SIZE} height={ICON_SIZE} />
            </BackButton>
            <Gap size={12} />
            <SearchBar />
          </AppBarContainer>
          <Gap size={16} />
          <SearchResultList />
        </Container>
      </BasePage>
    </SearchProvider>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
});

const AppBarContainer = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  height: APPBAR_HEIGHT,
  paddingHorizontal: HORIZONTAL_PADDING,
});

const BackButton = styled(TouchableOpacity)({
  width: ICON_SIZE,
  height: ICON_SIZE,
  justifyContent: 'center',
  alignItems: 'center',
});
