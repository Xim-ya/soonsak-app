/**
 * AdminUserContentListScreen - 어드민용 유저 콘텐츠 목록 페이지
 *
 * 특정 유저의 시청기록/찜/평가 목록을 확인하고,
 * 각 콘텐츠에 대해 푸시 알림을 보낼 수 있습니다.
 */

import { useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { BasePage } from '@/presentation/components/page';
import { ScreenRouteProp } from '@/presentation/navigation/types';
import { routePages } from '@/presentation/navigation/constant/routePages';
import type { UserContentItem } from '@/features/admin';
import {
  MemoizedAdminContentGridItem,
  GRID_POSTER_HEIGHT,
} from './_components/AdminContentGridItem';
import { useUserContentList } from './_hooks';

// ============================================================================
// Constants
// ============================================================================

const BACK_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const CLOSE_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6L6 18M6 6L18 18" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const SEND_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

type TabType = 'history' | 'favorites' | 'ratings';

const TABS: { key: TabType; label: string }[] = [
  { key: 'history', label: '시청기록' },
  { key: 'favorites', label: '찜' },
  { key: 'ratings', label: '평가' },
];

// 그리드 아이템 높이 계산 (포스터 + 버튼 영역 + 마진)
const GRID_ITEM_HEIGHT = GRID_POSTER_HEIGHT + 30 + 16;

// ============================================================================
// Component
// ============================================================================

export default function AdminUserContentListScreen() {
  const route = useRoute<ScreenRouteProp<typeof routePages.adminUserContentList>>();
  const insets = useSafeAreaInsets();

  const { userId, displayName, initialTab = 0 } = route.params;

  const {
    activeTab,
    setActiveTab,
    items,
    isLoading,
    isPushModalVisible,
    selectedContent,
    pushTitle,
    setPushTitle,
    pushBody,
    setPushBody,
    isSending,
    isValidInput,
    handleGoBack,
    handleOpenPushModal,
    handleClosePushModal,
    handleSendPush,
    getTitle,
    getEmptyMessage,
    MAX_TITLE_LENGTH,
    MAX_BODY_LENGTH,
  } = useUserContentList({ userId, displayName, initialTab });

  // 아이템 렌더링
  const renderItem = useCallback(
    ({ item }: { item: UserContentItem }) => (
      <MemoizedAdminContentGridItem
        item={item}
        showRating={activeTab === 'ratings'}
        showProgress={activeTab === 'history'}
        onActionPress={() => handleOpenPushModal(item)}
      />
    ),
    [activeTab, handleOpenPushModal],
  );

  // getItemLayout for 3-column grid performance
  const getItemLayout = useCallback(
    (_: ArrayLike<UserContentItem> | null | undefined, index: number) => {
      const rowIndex = Math.floor(index / 3);
      return {
        length: GRID_ITEM_HEIGHT,
        offset: GRID_ITEM_HEIGHT * rowIndex,
        index,
      };
    },
    [],
  );

  const keyExtractor = useCallback(
    (item: UserContentItem) => `${item.contentType}-${item.contentId}`,
    [],
  );

  return (
    <BasePage useSafeArea={false}>
      <Header paddingTop={insets.top}>
        <BackButton onPress={handleGoBack}>
          <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
        </BackButton>
        <HeaderTitle numberOfLines={1}>{getTitle()}</HeaderTitle>
        <HeaderSpacer />
      </Header>

      {/* 탭 */}
      <TabContainer>
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            isActive={activeTab === tab.key}
            onPress={() => setActiveTab(tab.key)}
          >
            <TabText isActive={activeTab === tab.key}>{tab.label}</TabText>
          </TabButton>
        ))}
      </TabContainer>

      {/* 콘텐츠 목록 */}
      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.primary} />
        </LoadingContainer>
      ) : items.length === 0 ? (
        <EmptyContainer>
          <EmptyText>{getEmptyMessage()}</EmptyText>
        </EmptyContainer>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={columnWrapperStyle}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          removeClippedSubviews
          maxToRenderPerBatch={9}
          windowSize={5}
          initialNumToRender={15}
        />
      )}

      {/* 푸시 발송 모달 */}
      <Modal
        visible={isPushModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClosePushModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ModalOverlay>
            <Pressable style={{ flex: 1 }} onPress={handleClosePushModal} />
            <ModalContent style={{ paddingBottom: insets.bottom + 16 }}>
              <ModalHeader>
                <ModalTitle>푸시 알림 발송</ModalTitle>
                <CloseButton onPress={handleClosePushModal}>
                  <SvgXml xml={CLOSE_ICON_SVG} width={24} height={24} />
                </CloseButton>
              </ModalHeader>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 선택된 콘텐츠 정보 */}
                {selectedContent && (
                  <SelectedContentInfo>
                    <SelectedContentLabel>딥링크 대상</SelectedContentLabel>
                    <SelectedContentTitle numberOfLines={1}>
                      {selectedContent.contentTitle}
                    </SelectedContentTitle>
                    <SelectedContentType>
                      {selectedContent.contentType === 'movie' ? '영화' : 'TV 시리즈'} 상세 페이지로
                      이동
                    </SelectedContentType>
                  </SelectedContentInfo>
                )}

                {/* 제목 입력 (선택) */}
                <InputSection>
                  <InputLabel>
                    제목 (선택){' '}
                    <CharCount>
                      ({pushTitle.length}/{MAX_TITLE_LENGTH})
                    </CharCount>
                  </InputLabel>
                  <StyledTextInput
                    value={pushTitle}
                    onChangeText={setPushTitle}
                    placeholder="없으면 앱 이름으로 표시"
                    placeholderTextColor={colors.gray03}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                </InputSection>

                {/* 내용 입력 */}
                <InputSection>
                  <InputLabel>
                    내용{' '}
                    <CharCount>
                      ({pushBody.length}/{MAX_BODY_LENGTH})
                    </CharCount>
                  </InputLabel>
                  <StyledTextInput
                    value={pushBody}
                    onChangeText={setPushBody}
                    placeholder="푸시 알림 내용"
                    placeholderTextColor={colors.gray03}
                    maxLength={MAX_BODY_LENGTH}
                    multiline
                    numberOfLines={3}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                </InputSection>
              </ScrollView>

              {/* 발송 버튼 */}
              <SendButton
                onPress={handleSendPush}
                disabled={!isValidInput || isSending}
                isDisabled={!isValidInput || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <SvgXml xml={SEND_ICON_SVG} width={20} height={20} />
                    <SendButtonText>발송하기</SendButtonText>
                  </>
                )}
              </SendButton>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>
    </BasePage>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const columnWrapperStyle = { gap: 9 };

const Header = styled(View)<{ paddingTop: number }>(({ paddingTop }) => ({
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
  ...textStyles.title1,
  color: colors.white,
  flex: 1,
  textAlign: 'center',
  marginHorizontal: 8,
});

const HeaderSpacer = styled(View)({
  width: 32,
});

const TabContainer = styled(View)({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 8,
  backgroundColor: colors.black,
});

interface TabButtonProps {
  isActive: boolean;
}

const TabButton = styled(TouchableOpacity)<TabButtonProps>(({ isActive }) => ({
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  backgroundColor: isActive ? colors.primary : colors.gray05,
  borderRadius: 8,
}));

const TabText = styled.Text<TabButtonProps>(({ isActive }) => ({
  ...textStyles.body2,
  color: isActive ? colors.white : colors.gray02,
  fontWeight: isActive ? '600' : '400',
}));

const LoadingContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const EmptyContainer = styled(View)({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
});

const EmptyText = styled.Text({
  ...textStyles.body1,
  color: colors.gray03,
  textAlign: 'center',
});

// Modal Styles
const ModalOverlay = styled(View)({
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  justifyContent: 'flex-end',
});

const ModalContent = styled(View)({
  backgroundColor: colors.gray06,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingHorizontal: 20,
  paddingTop: 20,
  maxHeight: '80%',
});

const ModalHeader = styled(View)({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
});

const ModalTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
});

const CloseButton = styled(TouchableOpacity)({
  padding: 4,
});

const SelectedContentInfo = styled(View)({
  backgroundColor: colors.gray05,
  borderRadius: 10,
  padding: 14,
  marginBottom: 20,
});

const SelectedContentLabel = styled.Text({
  ...textStyles.alert2,
  color: colors.gray02,
  marginBottom: 4,
});

const SelectedContentTitle = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  fontWeight: '600',
  marginBottom: 2,
});

const SelectedContentType = styled.Text({
  ...textStyles.alert2,
  color: colors.primary,
});

const InputSection = styled(View)({
  marginBottom: 16,
});

const InputLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  marginBottom: 8,
});

const CharCount = styled.Text({
  color: colors.gray03,
});

const StyledTextInput = styled(TextInput)({
  ...textStyles.body2,
  color: colors.white,
  backgroundColor: colors.gray05,
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 12,
});

interface SendButtonProps {
  isDisabled: boolean;
}

const SendButton = styled(TouchableOpacity)<SendButtonProps>(({ isDisabled }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: isDisabled ? colors.gray04 : colors.primary,
  borderRadius: 10,
  paddingVertical: 14,
  marginTop: 8,
}));

const SendButtonText = styled.Text({
  ...textStyles.body1,
  color: colors.white,
  fontWeight: '600',
});
