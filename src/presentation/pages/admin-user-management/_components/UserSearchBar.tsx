/**
 * UserSearchBar - 유저 검색바
 *
 * 검색 필드 선택 + 검색어 입력을 제공합니다.
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity, TextInput } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { type UserSearchField, UserSearchFieldLabel } from '@/features/admin';

// SVG 아이콘 상수 (컴포넌트 외부로 최적화)
const SEARCH_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const DROPDOWN_ICON_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 9L12 15L18 9" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

interface UserSearchBarProps {
  readonly searchQuery: string;
  readonly searchField: UserSearchField;
  readonly onSearchChange: (query: string) => void;
  readonly onSearchFieldChange: (field: UserSearchField) => void;
  readonly onSearch: () => void;
}

export const UserSearchBar = memo(function UserSearchBar({
  searchQuery,
  searchField,
  onSearchChange,
  onSearchFieldChange,
  onSearch,
}: UserSearchBarProps) {
  // 검색 필드 토글 (이메일 ↔ 닉네임)
  const handleFieldToggle = useCallback(() => {
    const nextField: UserSearchField = searchField === 'email' ? 'displayName' : 'email';
    onSearchFieldChange(nextField);
  }, [searchField, onSearchFieldChange]);

  // 엔터 키 검색
  const handleSubmit = useCallback(() => {
    onSearch();
  }, [onSearch]);

  return (
    <Container>
      {/* 검색 필드 선택 */}
      <FieldSelector onPress={handleFieldToggle} activeOpacity={0.7}>
        <FieldLabel>{UserSearchFieldLabel[searchField]}</FieldLabel>
        <SvgXml xml={DROPDOWN_ICON_SVG} width={16} height={16} />
      </FieldSelector>

      {/* 검색어 입력 */}
      <SearchInputContainer>
        <SvgXml xml={SEARCH_ICON_SVG} width={20} height={20} />
        <SearchInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="검색어 입력..."
          placeholderTextColor={colors.gray03}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </SearchInputContainer>

      {/* 검색 버튼 */}
      <SearchButton onPress={onSearch} activeOpacity={0.7}>
        <SearchButtonText>검색</SearchButtonText>
      </SearchButton>
    </Container>
  );
});

/* Styled Components */
const Container = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  gap: 8,
  backgroundColor: colors.black,
});

const FieldSelector = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray06,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 8,
  gap: 4,
});

const FieldLabel = styled.Text({
  ...textStyles.body2,
  color: colors.gray01,
});

const SearchInputContainer = styled.View({
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray06,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 8,
});

const SearchInput = styled(TextInput)({
  flex: 1,
  ...textStyles.body2,
  color: colors.white,
  paddingVertical: 10,
});

const SearchButton = styled(TouchableOpacity)({
  backgroundColor: colors.primary,
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
});

const SearchButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});
