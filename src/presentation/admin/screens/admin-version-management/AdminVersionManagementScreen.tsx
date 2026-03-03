/**
 * AdminVersionManagementScreen - 어드민 앱 버전 관리 페이지
 *
 * app_version_policy 테이블의 iOS/Android 버전 정책 관리
 * - 최신 버전, 최소 버전, 권장 버전, 심사 버전
 * - 강제/선택 업데이트 메시지
 */

import { useCallback, useState, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import { BasePage } from '@/presentation/components/page';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { supabaseClient } from '@/shared/api/supabaseClient';

// 뒤로가기 아이콘 SVG
const BACK_ICON_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface VersionPolicy {
  id: string;
  platform: 'ios' | 'android';
  latest_version: string;
  minimum_version: string;
  recommended_version: string;
  review_version: string | null;
  force_update_title: string;
  force_update_message: string;
  soft_update_title: string;
  soft_update_message: string;
}

type EditableField = keyof Omit<VersionPolicy, 'id' | 'platform'>;

const FIELD_LABELS: Record<EditableField, string> = {
  latest_version: '최신 버전',
  minimum_version: '최소 지원 버전',
  recommended_version: '권장 버전',
  review_version: '심사 중 버전',
  force_update_title: '강제 업데이트 제목',
  force_update_message: '강제 업데이트 메시지',
  soft_update_title: '선택 업데이트 제목',
  soft_update_message: '선택 업데이트 메시지',
};

const FIELD_DESCRIPTIONS: Partial<Record<EditableField, string>> = {
  minimum_version: '이 버전 미만은 강제 업데이트',
  recommended_version: '이 버전 미만은 선택적 업데이트 안내',
  review_version: '심사 통과 전 특별 처리용 (선택)',
};

export default function AdminVersionManagementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [policies, setPolicies] = useState<VersionPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPolicies, setEditedPolicies] = useState<Record<string, Partial<VersionPolicy>>>({});

  // 데이터 로드
  const fetchPolicies = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabaseClient
        .from('app_version_policy')
        .select('*')
        .order('platform');

      if (error) throw error;
      setPolicies(data || []);
      setEditedPolicies({});
    } catch (error) {
      Alert.alert('오류', '버전 정책을 불러오는데 실패했어요');
      console.error('fetchPolicies error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 필드 값 변경
  const handleFieldChange = useCallback(
    (policyId: string, field: EditableField, value: string) => {
      setEditedPolicies((prev) => ({
        ...prev,
        [policyId]: {
          ...prev[policyId],
          [field]: value,
        },
      }));
    },
    [],
  );

  // 현재 표시할 값 가져오기
  const getFieldValue = useCallback(
    (policy: VersionPolicy, field: EditableField): string => {
      const edited = editedPolicies[policy.id];
      if (edited && field in edited) {
        return (edited[field] as string) ?? '';
      }
      return (policy[field] as string) ?? '';
    },
    [editedPolicies],
  );

  // 변경사항 있는지 확인
  const hasChanges = Object.keys(editedPolicies).length > 0;

  // 저장
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);

      for (const [policyId, changes] of Object.entries(editedPolicies)) {
        const { error } = await supabaseClient
          .from('app_version_policy')
          .update({ ...changes, updated_at: new Date().toISOString() })
          .eq('id', policyId);

        if (error) throw error;
      }

      Alert.alert('완료', '버전 정책이 저장되었어요');
      fetchPolicies();
    } catch (error) {
      Alert.alert('오류', '저장에 실패했어요');
      console.error('handleSave error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editedPolicies, hasChanges, fetchPolicies]);

  // 플랫폼별 섹션 렌더링
  const renderPlatformSection = useCallback(
    (policy: VersionPolicy) => {
      const platformLabel = policy.platform === 'ios' ? 'iOS' : 'Android';
      const fields: EditableField[] = [
        'latest_version',
        'minimum_version',
        'recommended_version',
        'review_version',
        'force_update_title',
        'force_update_message',
        'soft_update_title',
        'soft_update_message',
      ];

      return (
        <PlatformSection key={policy.id}>
          <PlatformHeader>
            <PlatformTitle>{platformLabel}</PlatformTitle>
          </PlatformHeader>

          {fields.map((field) => (
            <FieldContainer key={field}>
              <FieldLabel>{FIELD_LABELS[field]}</FieldLabel>
              {FIELD_DESCRIPTIONS[field] && (
                <FieldDescription>{FIELD_DESCRIPTIONS[field]}</FieldDescription>
              )}
              <FieldInput
                value={getFieldValue(policy, field)}
                onChangeText={(text) => handleFieldChange(policy.id, field, text)}
                placeholder={field.includes('message') ? '메시지 입력' : '버전 입력 (예: 1.0.0)'}
                placeholderTextColor={colors.gray04}
                multiline={field.includes('message')}
                numberOfLines={field.includes('message') ? 3 : 1}
                textAlignVertical={field.includes('message') ? 'top' : 'center'}
              />
            </FieldContainer>
          ))}
        </PlatformSection>
      );
    },
    [getFieldValue, handleFieldChange],
  );

  return (
    <BasePage useSafeArea={false} touchableWithoutFeedback={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <HeaderContainer paddingTop={insets.top}>
          <BackButton onPress={handleGoBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <SvgXml xml={BACK_ICON_SVG} width={24} height={24} />
          </BackButton>
          <HeaderTitle>앱 버전 관리</HeaderTitle>
          <SaveButton onPress={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <SaveButtonText disabled={!hasChanges}>저장</SaveButtonText>
            )}
          </SaveButton>
        </HeaderContainer>

        {/* 콘텐츠 */}
        {isLoading ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color={colors.gray02} />
          </LoadingContainer>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <InfoBanner>
              <InfoText>
                버전 정책을 수정하면 앱 사용자에게 즉시 적용됩니다. 신중하게 변경해 주세요.
              </InfoText>
            </InfoBanner>

            {policies.map(renderPlatformSection)}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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

const SaveButton = styled(TouchableOpacity)<{ disabled?: boolean }>({
  paddingHorizontal: 12,
  paddingVertical: 6,
});

const SaveButtonText = styled.Text<{ disabled?: boolean }>(({ disabled }) => ({
  ...textStyles.body1,
  color: disabled ? colors.gray04 : colors.primary,
  fontWeight: '600',
}));

const LoadingContainer = styled.View({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
});

const InfoBanner = styled.View({
  backgroundColor: colors.gray05,
  marginHorizontal: 16,
  marginTop: 16,
  padding: 12,
  borderRadius: 8,
});

const InfoText = styled.Text({
  ...textStyles.desc,
  color: colors.gray02,
  lineHeight: 18,
});

const PlatformSection = styled.View({
  marginTop: 24,
  marginHorizontal: 16,
  backgroundColor: colors.gray06,
  borderRadius: 12,
  overflow: 'hidden',
});

const PlatformHeader = styled.View({
  backgroundColor: colors.gray05,
  paddingVertical: 12,
  paddingHorizontal: 16,
});

const PlatformTitle = styled.Text({
  ...textStyles.title2,
  color: colors.white,
  fontWeight: '700',
});

const FieldContainer = styled.View({
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray05,
});

const FieldLabel = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
  marginBottom: 4,
});

const FieldDescription = styled.Text({
  ...textStyles.desc,
  color: colors.gray03,
  marginBottom: 8,
});

const FieldInput = styled(TextInput)({
  backgroundColor: colors.gray05,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  ...textStyles.body2,
  color: colors.white,
  minHeight: 40,
});
