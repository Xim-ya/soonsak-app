/**
 * useProfileSetup - 프로필 설정 페이지 비즈니스 로직 훅
 *
 * 초기 설정(initial)과 수정(edit) 모드를 지원하며,
 * 닉네임 입력, 프로필 이미지 선택, 저장 로직을 관리합니다.
 *
 * @example
 * const {
 *   nickname,
 *   setNickname,
 *   avatarUrl,
 *   error,
 *   isLoading,
 *   isValid,
 *   handlePickImage,
 *   handleSubmit,
 * } = useProfileSetup({ mode: 'initial' });
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useNicknameValidation } from '@/features/user/hooks/useNicknameValidation';
import { userApi } from '@/features/user/api/userApi';
import type { ProfileSetupMode } from '@/features/user/types';
import type { RootStackParamList } from '@/shared/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseProfileSetupParams {
  mode: ProfileSetupMode;
}

interface UseProfileSetupReturn {
  /** 현재 닉네임 입력값 */
  nickname: string;
  /** 닉네임 변경 핸들러 */
  setNickname: (value: string) => void;
  /** 표시할 아바타 URL (새로 선택한 이미지 > 기존 이미지) */
  avatarUrl: string | undefined;
  /** 새로 선택한 이미지 URI */
  pickedImageUri: string | undefined;
  /** 에러 메시지 */
  error: string | null;
  /** 저장 중 로딩 상태 */
  isLoading: boolean;
  /** 유효한 상태 (저장 가능) */
  isValid: boolean;
  /** 변경 사항 있는지 (수정 모드용) */
  isChanged: boolean;
  /** 이미지 선택 핸들러 */
  handlePickImage: () => Promise<void>;
  /** 저장 핸들러 */
  handleSubmit: () => Promise<void>;
}

/**
 * 프로필 설정 페이지 훅
 */
export function useProfileSetup({ mode }: UseProfileSetupParams): UseProfileSetupReturn {
  const navigation = useNavigation<NavigationProp>();
  // DTO가 아닌 Model 사용: displayName, avatarUrl은 UserProfileModel에서 파생된 값
  const {
    user,
    displayName: currentDisplayName,
    avatarUrl: currentAvatarUrl,
    completeProfileSetup,
    refreshProfile,
  } = useAuth();
  const { validate, validateAsync, getErrorMessage } = useNicknameValidation();

  // 초기값 계산 (AuthProvider에서 이미 displayName 자동 생성됨)
  const initialValues = useMemo(
    () => ({
      initialNickname: currentDisplayName,
      initialAvatarUrl: currentAvatarUrl,
    }),
    [currentDisplayName, currentAvatarUrl],
  );

  // 상태 관리
  const [nickname, setNicknameState] = useState(initialValues.initialNickname);
  const [pickedImageUri, setPickedImageUri] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 현재 표시할 아바타 (새로 선택한 이미지 > 기존 이미지)
  const avatarUrl = pickedImageUri ?? initialValues.initialAvatarUrl;

  // 변경 여부 (수정 모드에서 저장 버튼 활성화 조건)
  const isChanged = nickname !== initialValues.initialNickname || pickedImageUri !== undefined;

  // 유효성 (에러 없고 닉네임이 있음)
  const isValid = error === null && nickname.length > 0;

  /**
   * 닉네임 변경 핸들러
   * 실시간 Validation 수행
   */
  const setNickname = useCallback(
    (value: string) => {
      setNicknameState(value);
      const errorKey = validate(value);
      setError(getErrorMessage(errorKey));
    },
    [validate, getErrorMessage],
  );

  /**
   * 이미지 선택
   */
  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setError('사진 접근 권한이 필요합니다');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPickedImageUri(result.assets[0].uri);
    }
  }, []);

  /**
   * 저장
   */
  const handleSubmit = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    // 수정 모드에서 변경 사항 없으면 뒤로가기
    if (mode === 'edit' && !isChanged) {
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 닉네임이 변경된 경우에만 비동기 검증 (중복 체크 포함)
      if (nickname !== initialValues.initialNickname) {
        const validationError = await validateAsync(nickname, userId);
        if (validationError) {
          setError(getErrorMessage(validationError));
          setIsLoading(false);
          return;
        }
      }

      // 이미지 업로드 (새로 선택한 경우)
      let uploadedAvatarUrl = initialValues.initialAvatarUrl;
      if (pickedImageUri) {
        uploadedAvatarUrl = await userApi.uploadProfileImage(userId, pickedImageUri);
      }

      // 프로필 업데이트
      await userApi.updateProfile(userId, {
        displayName: nickname,
        avatarUrl: uploadedAvatarUrl,
      });

      // AuthProvider의 프로필 데이터 새로고침
      await refreshProfile();

      // 프로필 설정 완료 표시 (ProfileSetupNavigator에서 다시 리다이렉트 방지)
      if (mode === 'initial') {
        completeProfileSetup();
      }

      // 이전 화면으로 복귀 (initial/edit 모두 동일)
      // initial 모드: 로그인 전 화면으로 복귀 (콘텐츠 상세 등)
      // edit 모드: 설정 화면으로 복귀
      navigation.goBack();
    } catch (e) {
      console.error('프로필 저장 실패:', e);
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    mode,
    isChanged,
    nickname,
    pickedImageUri,
    initialValues,
    validateAsync,
    getErrorMessage,
    navigation,
    completeProfileSetup,
    refreshProfile,
  ]);

  return {
    nickname,
    setNickname,
    avatarUrl,
    pickedImageUri,
    error,
    isLoading,
    isValid,
    isChanged,
    handlePickImage,
    handleSubmit,
  };
}
