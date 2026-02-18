import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import colors from '@/shared/styles/colors';

interface BasePageProps {
  children: React.ReactNode;
  // SafeArea 관련
  useSafeArea?: boolean;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
  safeAreaLeft?: boolean;
  safeAreaRight?: boolean;
  // 배경색 관련
  backgroundColor?: string;
  unsafeAreaColor?: string;
  // 상태바 관련
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  statusBarBackgroundColor?: string;
  statusBarHidden?: boolean;
  // 키보드 관련
  automaticallyAdjustKeyboardInsets?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  dismissKeyboardOnTap?: boolean;
  // 스크롤 관련
  scrollable?: boolean;
  scrollViewProps?: React.ComponentProps<typeof ScrollView>;
  // 터치 관련
  touchableWithoutFeedback?: boolean;
  // 라이프사이클 콜백
  onFocus?: () => void;
  onBlur?: () => void;
  onMount?: () => void;
  onUnmount?: () => void;
}

/**
 * 모든 화면에서 사용할 수 있는 기본 페이지 컴포넌트
 * SafeArea, 키보드 처리, 스크롤, 라이프사이클 등을 지원합니다.
 */
export const BasePage = React.memo<BasePageProps>(
  ({
    children,
    // SafeArea 기본값
    useSafeArea = true,
    safeAreaTop = true,
    safeAreaBottom = true,
    safeAreaLeft = true,
    safeAreaRight = true,
    // 배경색 기본값
    backgroundColor = colors.black,
    unsafeAreaColor,
    // 상태바 기본값
    statusBarStyle = 'light-content',
    statusBarBackgroundColor,
    statusBarHidden = false,
    // 키보드 기본값
    automaticallyAdjustKeyboardInsets = true,
    keyboardShouldPersistTaps = 'handled',
    dismissKeyboardOnTap = true,
    // 스크롤 기본값
    scrollable = false,
    scrollViewProps = {},
    // 터치 기본값
    touchableWithoutFeedback = true,
    // 라이프사이클 콜백
    onFocus,
    onBlur,
    onMount,
    onUnmount,
  }) => {
    // 마운트/언마운트 라이프사이클
    useEffect(() => {
      onMount?.();
      return () => onUnmount?.();
    }, [onMount, onUnmount]);

    // 포커스/블러 라이프사이클
    useFocusEffect(
      React.useCallback(() => {
        onFocus?.();
        return () => onBlur?.();
      }, [onFocus, onBlur]),
    );

    // 키보드 해제 함수
    const dismissKeyboard = () => {
      if (dismissKeyboardOnTap) {
        Keyboard.dismiss();
      }
    };

    // 상태바 설정
    const statusBarProps = {
      barStyle: statusBarStyle,
      backgroundColor: statusBarBackgroundColor || backgroundColor,
      hidden: statusBarHidden,
      translucent: Platform.OS === 'android',
    };

    // 컨테이너 스타일
    const containerStyle = [styles.container, { backgroundColor }];

    // 언세이프 영역 컨테이너 스타일
    const unsafeContainerStyle = [
      styles.unsafeContainer,
      { backgroundColor: unsafeAreaColor || backgroundColor },
    ];

    // 콘텐츠 렌더링
    const renderContent = () => {
      let content = children;

      // 스크롤 가능한 경우 ScrollView로 감싸기
      if (scrollable) {
        content = (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            {...scrollViewProps}
          >
            {content}
          </ScrollView>
        );
      }

      // 키보드 회피 처리
      if (automaticallyAdjustKeyboardInsets) {
        content = (
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {content}
          </KeyboardAvoidingView>
        );
      }

      return content;
    };

    // 터치 이벤트 처리
    const wrapWithTouchHandler = (content: React.ReactNode) => {
      if (touchableWithoutFeedback) {
        return (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.touchableContainer}>{content}</View>
          </TouchableWithoutFeedback>
        );
      }
      return content;
    };

    // SafeArea edges 계산
    const safeAreaEdges = useMemo<Edge[]>(() => {
      if (!useSafeArea) return [];
      const edges: Edge[] = [];
      if (safeAreaTop) edges.push('top');
      if (safeAreaBottom) edges.push('bottom');
      if (safeAreaLeft) edges.push('left');
      if (safeAreaRight) edges.push('right');
      return edges;
    }, [useSafeArea, safeAreaTop, safeAreaBottom, safeAreaLeft, safeAreaRight]);

    // 메인 콘텐츠
    const mainContent = (
      <View style={containerStyle}>
        <StatusBar {...statusBarProps} />
        {renderContent()}
      </View>
    );

    // SafeArea 적용
    if (useSafeArea && safeAreaEdges.length > 0) {
      return (
        <View style={unsafeContainerStyle}>
          <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={safeAreaEdges}>
            {wrapWithTouchHandler(mainContent)}
          </SafeAreaView>
        </View>
      );
    }

    return <View style={unsafeContainerStyle}>{wrapWithTouchHandler(mainContent)}</View>;
  },
);

const styles = StyleSheet.create({
  unsafeContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  touchableContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
});

BasePage.displayName = 'BasePage';
