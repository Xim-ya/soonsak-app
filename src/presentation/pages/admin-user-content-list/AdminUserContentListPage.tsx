/**
 * AdminUserContentListPage - 어드민용 유저 콘텐츠 목록 페이지
 *
 * 특정 유저의 시청기록/찜/평가 목록을 확인하고,
 * 각 콘텐츠에 대해 푸시 알림을 보낼 수 있습니다.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { BasePage } from '@/presentation/components/page';
import { ScreenRouteProp, RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { adminUserApi, type UserContentItem } from '@/features/admin';
import type { PushData } from '@/features/admin/types/pushAction';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MemoizedAdminContentGridItem,
  GRID_ITEM_WIDTH,
  GRID_POSTER_HEIGHT,
} from './_components/AdminContentGridItem';

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

// 탭 인덱스를 탭 키로 변환
const TAB_INDEX_TO_KEY: TabType[] = ['history', 'favorites', 'ratings'];

const MAX_TITLE_LENGTH = 50;
const MAX_BODY_LENGTH = 200;

// 그리드 아이템 높이 계산 (포스터 + 버튼 영역 + 마진)
const GRID_ITEM_HEIGHT = GRID_POSTER_HEIGHT + 30 + 16;

// ============================================================================
// Component
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AdminUserContentListPage() {
  const route = useRoute<ScreenRouteProp<typeof routePages.adminUserContentList>>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const { userId, displayName, initialTab = 0 } = route.params;
  const initialTabKey = TAB_INDEX_TO_KEY[initialTab] ?? 'history';

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>(initialTabKey);

  // 데이터 상태
  const [items, setItems] = useState<UserContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 푸시 모달 상태
  const [isPushModalVisible, setIsPushModalVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState<UserContentItem | null>(null);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let data: UserContentItem[] = [];
        switch (activeTab) {
          case 'history':
            data = await adminUserApi.getUserWatchHistory(userId, 100);
            break;
          case 'favorites':
            data = await adminUserApi.getUserFavorites(userId, 100);
            break;
          case 'ratings':
            data = await adminUserApi.getUserRatings(userId, 100);
            break;
        }
        setItems(data);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, userId]);

  // 푸시 모달 열기
  const handleOpenPushModal = useCallback((item: UserContentItem) => {
    setSelectedContent(item);
    setPushTitle('');
    setPushBody('');
    setIsPushModalVisible(true);
  }, []);

  // 푸시 모달 닫기
  const handleClosePushModal = useCallback(() => {
    setIsPushModalVisible(false);
    setSelectedContent(null);
  }, []);

  // 푸시 발송
  const handleSendPush = useCallback(async () => {
    if (!selectedContent || isSending) return;

    const trimmedTitle = pushTitle.trim();
    const trimmedBody = pushBody.trim();

    if (trimmedTitle.length === 0 || trimmedBody.length === 0) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSending(true);

    try {
      // ContentDetail 딥링크 데이터 생성
      const pushData: PushData = {
        version: '1.0',
        action: {
          type: 'NAVIGATION',
          screen: 'ContentDetail',
          params: {
            id: selectedContent.contentId,
            title: selectedContent.contentTitle,
            type: selectedContent.contentType,
          },
        },
      };

      const result = await adminUserApi.sendPushNotification(
        userId,
        trimmedTitle,
        trimmedBody,
        pushData,
      );

      if (result.success) {
        Alert.alert('발송 완료', `푸시 알림이 발송되었습니다. (${result.sentCount}건)`);
        handleClosePushModal();
      } else {
        Alert.alert('발송 실패', '활성화된 푸시 토큰이 없습니다.');
      }
    } catch (err) {
      console.error('푸시 발송 실패:', err);
      Alert.alert('발송 실패', '푸시 알림 발송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  }, [selectedContent, pushTitle, pushBody, userId, isSending, handleClosePushModal]);

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

  // 탭별 타이틀
  const getTitle = () => {
    const userName = displayName || '유저';
    switch (activeTab) {
      case 'history':
        return `${userName}의 시청기록`;
      case 'favorites':
        return `${userName}의 찜 목록`;
      case 'ratings':
        return `${userName}의 평가`;
    }
  };

  // 빈 상태 메시지
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'history':
        return '시청기록이 없습니다';
      case 'favorites':
        return '찜한 콘텐츠가 없습니다';
      case 'ratings':
        return '평가한 콘텐츠가 없습니다';
    }
  };

  const isValidInput = pushTitle.trim().length > 0 && pushBody.trim().length > 0;

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

                {/* 제목 입력 */}
                <InputSection>
                  <InputLabel>
                    제목 <CharCount>({pushTitle.length}/{MAX_TITLE_LENGTH})</CharCount>
                  </InputLabel>
                  <StyledTextInput
                    value={pushTitle}
                    onChangeText={(text) => setPushTitle(text.slice(0, MAX_TITLE_LENGTH))}
                    placeholder="푸시 알림 제목"
                    placeholderTextColor={colors.gray03}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                </InputSection>

                {/* 내용 입력 */}
                <InputSection>
                  <InputLabel>
                    내용 <CharCount>({pushBody.length}/{MAX_BODY_LENGTH})</CharCount>
                  </InputLabel>
                  <StyledTextInput
                    value={pushBody}
                    onChangeText={(text) => setPushBody(text.slice(0, MAX_BODY_LENGTH))}
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
// Styles
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
