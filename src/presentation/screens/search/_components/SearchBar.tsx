import React, { useRef } from 'react';
import { TextInput, TouchableOpacity, Keyboard } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/presentation/styles/colors';
import textStyles from '@/presentation/styles/textStyles';
import { useSearchContext } from '../_provider/SearchProvider';

const ICON_SIZE = 20;
const INPUT_HEIGHT = 40;

// 검색 아이콘 SVG
const searchIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// X 아이콘 SVG
const clearIconSvg = `
<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6L6 18M6 6L18 18" stroke="${colors.gray02}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/**
 * SearchBar - 검색 입력 바 컴포넌트
 *
 * 검색어 입력, 초기화 기능을 제공합니다.
 */
function SearchBar() {
  const { searchText, setSearchText, clearSearchText } = useSearchContext();
  const inputRef = useRef<TextInput>(null);
  const hasText = searchText.length > 0;

  const handleClear = () => {
    clearSearchText();
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
  };

  return (
    <Container>
      <SearchIconWrapper>
        <SvgXml xml={searchIconSvg} width={ICON_SIZE} height={ICON_SIZE} />
      </SearchIconWrapper>
      <TextInput
        ref={inputRef}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="콘텐츠 검색"
        placeholderTextColor={colors.gray02}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        autoCorrect={false}
        autoCapitalize="none"
        style={inputStyle}
        accessibilityLabel="콘텐츠 검색 입력"
        accessibilityHint="검색어를 입력하면 콘텐츠를 검색합니다"
      />
      {hasText && (
        <ClearButton
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="검색어 지우기"
        >
          <SvgXml xml={clearIconSvg} width={ICON_SIZE} height={ICON_SIZE} />
        </ClearButton>
      )}
    </Container>
  );
}

/* Styled Components */
const Container = styled.View({
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gray05,
  borderRadius: 8,
  paddingHorizontal: 12,
  height: INPUT_HEIGHT,
});

const SearchIconWrapper = styled.View({
  marginRight: 8,
});

const inputStyle = {
  flex: 1,
  fontFamily: textStyles.body2.fontFamily,
  fontSize: textStyles.body2.fontSize,
  letterSpacing: textStyles.body2.letterSpacing,
  color: colors.white,
  padding: 0,
  textAlignVertical: 'center' as const,
};

const ClearButton = styled(TouchableOpacity)({
  marginLeft: 8,
  padding: 4,
});

export { SearchBar };
