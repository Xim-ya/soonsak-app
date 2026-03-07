import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import textStyle from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';

// 상수 정의
const APPBAR_HEIGHT = 48;
const ICON_SIZE = 24;
const BACK_BUTTON_MARGIN = 16;
const TITLE_PADDING = 12;

// SVG 아이콘 문자열 (동적 색상 변경을 위해 fill을 placeholder로 설정)
const backArrowSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.1351 22.6217L8.50507 14.0001L16.1351 5.37842L17.2201 6.34675L10.4417 14.0001L17.2201 21.6534L16.1351 22.6217Z" fill="ICON_COLOR"/>
</svg>
`;

interface BackButtonAppBarProps {
  /** 앱바에 표시될 제목 */
  title?: string;
  /** 뒤로가기 버튼 표시 여부 */
  showBackButton?: boolean;
  /** 뒤로가기 버튼 클릭 시 실행될 콜백 함수 */
  onBackPress?: () => void;
  /** 오른쪽에 표시될 액션 버튼들 */
  actions?: React.ReactNode[];
  /** 앱바 배경색 */
  backgroundColor?: string;
  /** 제목 텍스트 색상 */
  titleColor?: string;
  /** 뒤로가기 아이콘 색상 */
  backIconColor?: string;
  /** 제목 중앙 정렬 여부 */
  centerAligned?: boolean;
  /** 앱바 포지션 타입 (absolute를 위한 스택 포지션 지원) */
  position?: 'relative' | 'absolute';
  /** absolute 포지션일 때의 top 값 */
  top?: number;
  /** absolute 포지션일 때의 left 값 */
  left?: number;
  /** absolute 포지션일 때의 right 값 */
  right?: number;
  /** absolute 포지션일 때의 z-index 값 */
  zIndex?: number;
}

/**
 * 뒤로가기 버튼이 있는 공통 앱바 컴포넌트
 */
const BackButtonAppBar = React.memo<BackButtonAppBarProps>(
  ({
    title,
    showBackButton = true,
    onBackPress,
    actions,
    backgroundColor = 'transparent',
    titleColor = colors.white,
    backIconColor = colors.white,
    centerAligned = false,
    position = 'relative',
    top,
    left,
    right,
    zIndex,
  }) => {
    const navigation = useNavigation();

    // 뒤로가기 핸들러 최적화
    const handleBackPress = useCallback(() => {
      if (onBackPress) {
        onBackPress();
      } else {
        navigation.goBack();
      }
    }, [onBackPress, navigation]);

    // SVG 색상 동적 변경 (메모이제이션)
    const svgWithColor = useMemo(
      () => backArrowSvg.replace('ICON_COLOR', backIconColor),
      [backIconColor],
    );

    // 액션 버튼 존재 여부 확인
    const hasActions = actions && actions.length > 0;

    return (
      <Container
        backgroundColor={backgroundColor}
        position={position as 'relative' | 'absolute'}
        top={top}
        left={left}
        right={right}
        zIndex={zIndex}
      >
        {/* 뒤로가기 버튼 */}
        {showBackButton && (
          <BackButton
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
          >
            <SvgXml xml={svgWithColor} width={ICON_SIZE} height={ICON_SIZE} />
          </BackButton>
        )}

        {/* 제목 */}
        {title && (
          <TitleContainer centerAligned={centerAligned} showBackButton={showBackButton}>
            <Title titleColor={titleColor} numberOfLines={1}>
              {title}
            </Title>
          </TitleContainer>
        )}

        {/* 액션 버튼들 */}
        {hasActions && (
          <RightSection>
            {actions!.map((action, index) => (
              <ActionItem key={index}>{action}</ActionItem>
            ))}
          </RightSection>
        )}
      </Container>
    );
  },
);

/* Styled Components */
const Container = styled.View<{
  backgroundColor: string;
  position: 'relative' | 'absolute';
  top?: number | undefined;
  left?: number | undefined;
  right?: number | undefined;
  zIndex?: number | undefined;
}>(({ backgroundColor, position, top, left, right, zIndex }) => ({
  height: APPBAR_HEIGHT,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor,
  position,
  ...(position === 'absolute' && {
    top,
    left,
    right,
    zIndex: zIndex || 999,
  }),
}));

const BackButton = styled(TouchableOpacity)({
  width: ICON_SIZE,
  height: ICON_SIZE,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: BACK_BUTTON_MARGIN,
});

const TitleContainer = styled.View<{ centerAligned: boolean; showBackButton: boolean }>(
  ({ centerAligned, showBackButton }) => {
    const baseStyles = {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: centerAligned ? ('center' as const) : ('flex-start' as const),
      paddingRight: BACK_BUTTON_MARGIN,
    };

    if (centerAligned) {
      return {
        ...baseStyles,
        position: 'absolute' as const,
        left: BACK_BUTTON_MARGIN + ICON_SIZE + BACK_BUTTON_MARGIN,
        right: BACK_BUTTON_MARGIN + ICON_SIZE + BACK_BUTTON_MARGIN,
        zIndex: 1,
      };
    }

    return {
      ...baseStyles,
      paddingLeft: showBackButton ? TITLE_PADDING : BACK_BUTTON_MARGIN,
    };
  },
);

const Title = styled.Text<{ titleColor: string }>(({ titleColor }) => ({
  ...textStyle.headline2,
  color: titleColor,
}));

const RightSection = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingRight: BACK_BUTTON_MARGIN,
  marginLeft: 'auto',
});

const ActionItem = styled.View({
  marginLeft: 8,
});

BackButtonAppBar.displayName = 'BackButtonAppBar';

export { BackButtonAppBar, APPBAR_HEIGHT };
