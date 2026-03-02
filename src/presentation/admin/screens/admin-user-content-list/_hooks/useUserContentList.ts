/**
 * useUserContentList - 유저 콘텐츠 목록 관리 훅
 *
 * 유저의 시청기록/찜/평가 목록과 푸시 모달 상태를 관리합니다.
 *
 * @example
 * const {
 *   activeTab, setActiveTab, items, isLoading,
 *   isPushModalVisible, handleOpenPushModal, handleClosePushModal,
 *   pushTitle, setPushTitle, pushBody, setPushBody, isSending, handleSendPush,
 *   getTitle, getEmptyMessage
 * } = useUserContentList({ userId, displayName, initialTab });
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDialog } from '@/presentation/components/dialog';
import { RootStackParamList } from '@/shared/navigation/types';
import { adminUserApi, type UserContentItem } from '@/features/admin';
import type { PushData } from '@/features/admin/types/pushAction';

type TabType = 'history' | 'favorites' | 'ratings';

// 탭 인덱스를 탭 키로 변환
const TAB_INDEX_TO_KEY: TabType[] = ['history', 'favorites', 'ratings'];

const MAX_TITLE_LENGTH = 50;
const MAX_BODY_LENGTH = 200;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseUserContentListParams {
  userId: string;
  displayName?: string | null | undefined;
  initialTab?: number;
}

interface UseUserContentListReturn {
  // 탭 상태
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // 데이터 상태
  items: UserContentItem[];
  isLoading: boolean;

  // 푸시 모달 상태
  isPushModalVisible: boolean;
  selectedContent: UserContentItem | null;
  pushTitle: string;
  setPushTitle: (title: string) => void;
  pushBody: string;
  setPushBody: (body: string) => void;
  isSending: boolean;
  isValidInput: boolean;

  // 핸들러
  handleGoBack: () => void;
  handleOpenPushModal: (item: UserContentItem) => void;
  handleClosePushModal: () => void;
  handleSendPush: () => Promise<void>;

  // 헬퍼
  getTitle: () => string;
  getEmptyMessage: () => string;

  // 상수
  MAX_TITLE_LENGTH: number;
  MAX_BODY_LENGTH: number;
}

export function useUserContentList({
  userId,
  displayName,
  initialTab = 0,
}: UseUserContentListParams): UseUserContentListReturn {
  const navigation = useNavigation<NavigationProp>();
  const { showDialog } = useDialog();

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

    if (trimmedBody.length === 0) {
      await showDialog({
        title: '입력 오류',
        description: '내용을 입력해주세요',
        buttonText: '확인',
      });
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
        const dialogResult = await showDialog({
          title: '발송 완료',
          description: `푸시 알림을 발송했어요 (${result.sentCount}건)`,
          buttonText: '확인',
        });
        if (dialogResult === 'confirm') {
          handleClosePushModal();
        }
      } else {
        await showDialog({
          title: '발송 실패',
          description: '활성화된 푸시 토큰이 없어요',
          buttonText: '확인',
        });
      }
    } catch (err) {
      console.error('푸시 발송 실패:', err);
      await showDialog({
        title: '발송 실패',
        description: '푸시 알림을 발송하지 못했어요',
        buttonText: '확인',
      });
    } finally {
      setIsSending(false);
    }
  }, [selectedContent, pushTitle, pushBody, userId, isSending, handleClosePushModal, showDialog]);

  // 탭별 타이틀
  const getTitle = useCallback(() => {
    const userName = displayName ?? '유저';
    switch (activeTab) {
      case 'history':
        return `${userName}의 시청기록`;
      case 'favorites':
        return `${userName}의 찜 목록`;
      case 'ratings':
        return `${userName}의 평가`;
    }
  }, [activeTab, displayName]);

  // 빈 상태 메시지
  const getEmptyMessage = useCallback(() => {
    switch (activeTab) {
      case 'history':
        return '시청기록이 없어요';
      case 'favorites':
        return '찜한 콘텐츠가 없어요';
      case 'ratings':
        return '평가한 콘텐츠가 없어요';
    }
  }, [activeTab]);

  const isValidInput = pushBody.trim().length > 0;

  return {
    activeTab,
    setActiveTab,
    items,
    isLoading,
    isPushModalVisible,
    selectedContent,
    pushTitle,
    setPushTitle: (title: string) => setPushTitle(title.slice(0, MAX_TITLE_LENGTH)),
    pushBody,
    setPushBody: (body: string) => setPushBody(body.slice(0, MAX_BODY_LENGTH)),
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
  };
}
