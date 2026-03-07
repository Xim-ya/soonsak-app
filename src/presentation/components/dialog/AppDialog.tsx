/**
 * AppDialog - 공용 다이얼로그 컴포넌트
 *
 * Flutter AppDialog 모듈을 React Native로 마이그레이션한 컴포넌트입니다.
 * iOS Cupertino 스타일의 다이얼로그로, 두 가지 형태를 지원합니다:
 *
 * 1. SingleButton (singleBtn): 단일 확인 버튼
 * 2. DividedButton (dividedBtn): 좌/우 두 개의 버튼
 *
 * @example
 * // 단일 버튼 형태
 * <AppDialog
 *   visible={visible}
 *   title="알림"
 *   description="작업이 완료되었습니다."
 *   buttonText="확인"
 *   onButtonPress={handleClose}
 * />
 *
 * @example
 * // 분리된 버튼 형태
 * <AppDialog
 *   visible={visible}
 *   title="삭제 확인"
 *   description="정말 삭제하시겠습니까?"
 *   isDivided
 *   leftButtonText="취소"
 *   rightButtonText="삭제"
 *   onLeftButtonPress={handleCancel}
 *   onRightButtonPress={handleDelete}
 * />
 *
 * (Toss Frontend Fundamentals - 예측가능성 원칙 적용)
 * (react-native-expert - Emotion Native, textStyles, colors 시스템 적용)
 */

import React, { memo, useCallback } from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import styled from '@emotion/native';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';

/** 다이얼로그 레이아웃 상수 */
const DIALOG_RADIUS = 12;
const DIALOG_MAX_WIDTH = 256;
const DIALOG_MIN_HEIGHT = 120;
const DIALOG_HORIZONTAL_MARGIN = 16;
const CONTENT_HORIZONTAL_PADDING = 28;
const TITLE_TOP_PADDING = 14;
const TITLE_BOTTOM_PADDING = 10;
const DESCRIPTION_BOTTOM_PADDING = 16;
const BUTTON_HEIGHT_SINGLE = 50;
const BUTTON_HEIGHT_DIVIDED = 44;
const DIVIDER_WIDTH = 0.5;
const SUBTITLE_BOTTOM_MARGIN = 14;

/** 공통 Props (단일/분리 버튼 모두 사용) */
interface AppDialogBaseProps {
  /** 다이얼로그 표시 여부 */
  readonly visible: boolean;
  /** 다이얼로그 제목 */
  readonly title: string;
  /** 부제목 (선택) */
  readonly subTitle?: string;
  /** 설명 텍스트 (선택) */
  readonly description?: string;
  /** 배경 터치로 닫기 허용 여부 (기본: true) */
  readonly dismissOnBackdrop?: boolean;
  /** 배경 터치 시 호출 */
  readonly onBackdropPress?: () => void;
}

/** 단일 버튼 다이얼로그 Props */
interface SingleButtonDialogProps extends AppDialogBaseProps {
  /** 분리된 버튼 형태가 아님을 명시 */
  readonly isDivided?: false;
  /** 버튼 텍스트 (기본: '확인') */
  readonly buttonText?: string;
  /** 버튼 클릭 시 호출 */
  readonly onButtonPress: () => void;
  // 분리 버튼 props는 없음
  readonly leftButtonText?: never;
  readonly rightButtonText?: never;
  readonly onLeftButtonPress?: never;
  readonly onRightButtonPress?: never;
}

/** 분리된 버튼 다이얼로그 Props */
interface DividedButtonDialogProps extends AppDialogBaseProps {
  /** 분리된 버튼 형태임을 명시 */
  readonly isDivided: true;
  /** 왼쪽 버튼 텍스트 */
  readonly leftButtonText: string;
  /** 오른쪽 버튼 텍스트 */
  readonly rightButtonText: string;
  /** 왼쪽 버튼 클릭 시 호출 */
  readonly onLeftButtonPress: () => void;
  /** 오른쪽 버튼 클릭 시 호출 */
  readonly onRightButtonPress: () => void;
  // 단일 버튼 props는 없음
  readonly buttonText?: never;
  readonly onButtonPress?: never;
}

type AppDialogProps = SingleButtonDialogProps | DividedButtonDialogProps;

/** 타입 가드: 분리된 버튼 다이얼로그인지 확인 */
function isDividedDialog(props: AppDialogProps): props is DividedButtonDialogProps {
  return props.isDivided === true;
}

function AppDialogComponent(props: AppDialogProps): React.ReactElement {
  const {
    visible,
    title,
    subTitle,
    description,
    dismissOnBackdrop = true,
    onBackdropPress,
  } = props;

  // 배경 터치 핸들러
  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) {
      onBackdropPress?.();
    }
  }, [dismissOnBackdrop, onBackdropPress]);

  // 다이얼로그 내부 터치 이벤트 전파 방지
  const handleDialogPress = useCallback(() => {
    // 이벤트 전파 방지를 위해 빈 함수
  }, []);

  // 부제목과 설명 존재 여부
  const hasSubTitle = Boolean(subTitle);
  const hasDescription = Boolean(description);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onBackdropPress}
    >
      <TouchableWithoutFeedback
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="다이얼로그 닫기"
      >
        <Overlay>
          <TouchableWithoutFeedback onPress={handleDialogPress}>
            <DialogContainer
              accessible
              accessibilityRole="alert"
              accessibilityLabel={`${title} 다이얼로그`}
            >
              {/* 본문 영역 */}
              <ContentWrapper>
                {/* 제목 */}
                <TitleWrapper>
                  <TitleText accessibilityRole="header">{title}</TitleText>
                </TitleWrapper>

                {/* 부제목 (선택) */}
                {hasSubTitle && <SubTitleText>{subTitle}</SubTitleText>}

                {/* 설명 (선택) */}
                {hasDescription && (
                  <DescriptionWrapper>
                    <DescriptionText>{description}</DescriptionText>
                  </DescriptionWrapper>
                )}
              </ContentWrapper>

              {/* 버튼 영역 */}
              {isDividedDialog(props) ? (
                <DividedButtonContainer>
                  {/* 왼쪽 버튼 */}
                  <DividedButton
                    onPress={props.onLeftButtonPress}
                    activeOpacity={0.7}
                    isLeft
                    accessibilityRole="button"
                    accessibilityLabel={props.leftButtonText}
                  >
                    <ButtonText>{props.leftButtonText}</ButtonText>
                  </DividedButton>

                  {/* 구분선 */}
                  <VerticalDivider />

                  {/* 오른쪽 버튼 */}
                  <DividedButton
                    onPress={props.onRightButtonPress}
                    activeOpacity={0.7}
                    isLeft={false}
                    accessibilityRole="button"
                    accessibilityLabel={props.rightButtonText}
                  >
                    <ButtonText>{props.rightButtonText}</ButtonText>
                  </DividedButton>
                </DividedButtonContainer>
              ) : (
                <SingleButton
                  onPress={props.onButtonPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={props.buttonText ?? '확인'}
                >
                  <SingleButtonInner>
                    <ButtonText>{props.buttonText ?? '확인'}</ButtonText>
                  </SingleButtonInner>
                </SingleButton>
              )}
            </DialogContainer>
          </TouchableWithoutFeedback>
        </Overlay>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* Styled Components */

const Overlay = styled.View({
  flex: 1,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
});

const DialogContainer = styled.View({
  marginHorizontal: DIALOG_HORIZONTAL_MARGIN,
  minHeight: DIALOG_MIN_HEIGHT,
  maxWidth: DIALOG_MAX_WIDTH,
  width: '100%',
  borderRadius: DIALOG_RADIUS,
  backgroundColor: colors.strongGrey,
});

const ContentWrapper = styled.View({
  paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
});

const TitleWrapper = styled.View({
  paddingTop: TITLE_TOP_PADDING,
  paddingBottom: TITLE_BOTTOM_PADDING,
  alignItems: 'center',
});

const TitleText = styled.Text({
  ...textStyles.title3,
  color: colors.main,
  textAlign: 'center',
});

const SubTitleText = styled.Text({
  ...textStyles.alert1,
  color: colors.white,
  textAlign: 'center',
  marginBottom: SUBTITLE_BOTTOM_MARGIN,
});

const DescriptionWrapper = styled.View({
  paddingBottom: DESCRIPTION_BOTTOM_PADDING,
  alignItems: 'center',
});

const DescriptionText = styled.Text({
  ...textStyles.desc,
  color: colors.lightGrey,
  textAlign: 'center',
  lineHeight: 16,
});

// 분리된 버튼 컨테이너
const DividedButtonContainer = styled.View({
  height: BUTTON_HEIGHT_DIVIDED,
  flexDirection: 'row',
  borderTopWidth: DIVIDER_WIDTH,
  borderTopColor: colors.gray05,
});

// 분리된 버튼
const DividedButton = styled(TouchableOpacity)<{ isLeft: boolean }>(({ isLeft }) => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  borderBottomLeftRadius: isLeft ? DIALOG_RADIUS - 2 : 0,
  borderBottomRightRadius: isLeft ? 0 : DIALOG_RADIUS - 2,
}));

// 세로 구분선
const VerticalDivider = styled(View)({
  width: DIVIDER_WIDTH,
  backgroundColor: colors.gray05,
});

// 단일 버튼 (외부 TouchableOpacity)
const SingleButton = styled(TouchableOpacity)({
  borderBottomLeftRadius: DIALOG_RADIUS - 2,
  borderBottomRightRadius: DIALOG_RADIUS - 2,
});

// 단일 버튼 내부 컨테이너
const SingleButtonInner = styled.View({
  height: BUTTON_HEIGHT_SINGLE,
  justifyContent: 'center',
  alignItems: 'center',
  borderTopWidth: DIVIDER_WIDTH,
  borderTopColor: colors.gray05,
});

// 버튼 텍스트
const ButtonText = styled.Text({
  ...textStyles.title3,
  color: colors.white,
});

export const AppDialog = memo(AppDialogComponent);
export type { AppDialogProps, SingleButtonDialogProps, DividedButtonDialogProps };
