/**
 * ViewModeToggle - 뷰 모드 전환 토글 컴포넌트
 *
 * 카드 뷰 / 리스트 뷰 간 전환을 위한 세그먼트 버튼입니다.
 * - 좌측: 카드 뷰 (큰 썸네일)
 * - 우측: 리스트 뷰 (검색 결과 스타일)
 *
 * @example
 * <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
 */

import { memo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';

export type ViewMode = 'card' | 'list';

interface ViewModeToggleProps {
  readonly mode: ViewMode;
  readonly onModeChange: (mode: ViewMode) => void;
}

function ViewModeToggleComponent({ mode, onModeChange }: ViewModeToggleProps) {
  const handleCardPress = useCallback(() => {
    onModeChange('card');
  }, [onModeChange]);

  const handleListPress = useCallback(() => {
    onModeChange('list');
  }, [onModeChange]);

  return (
    <Container>
      <ToggleButton
        onPress={handleCardPress}
        activeOpacity={0.7}
        accessibilityLabel="View mode: cards"
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'card' }}
      >
        <IconBox isActive={mode === 'card'}>
          <CardIcon isActive={mode === 'card'} />
        </IconBox>
      </ToggleButton>
      <ToggleButton
        onPress={handleListPress}
        activeOpacity={0.7}
        accessibilityLabel="View mode: list"
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'list' }}
      >
        <IconBox isActive={mode === 'list'}>
          <ListIconContainer>
            <ListIconLine isActive={mode === 'list'} />
            <ListIconLine isActive={mode === 'list'} />
            <ListIconLine isActive={mode === 'list'} />
          </ListIconContainer>
        </IconBox>
      </ToggleButton>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  flexDirection: 'row',
  backgroundColor: colors.gray05,
  borderRadius: 8,
  padding: 3,
  gap: 2,
});

const ToggleButton = styled(TouchableOpacity)({
  padding: 2,
});

const IconBox = styled.View<{ isActive: boolean }>(({ isActive }) => ({
  width: 28,
  height: 24,
  borderRadius: 6,
  backgroundColor: isActive ? colors.main : 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
}));

// 카드 뷰 아이콘 (단일 사각형)
const CardIcon = styled.View<{ isActive: boolean }>(({ isActive }) => ({
  width: 14,
  height: 10,
  borderRadius: 2,
  backgroundColor: isActive ? colors.white : colors.gray03,
}));

// 리스트 뷰 아이콘 (3줄 라인)
const ListIconContainer = styled.View({
  gap: 2,
});

const ListIconLine = styled.View<{ isActive: boolean }>(({ isActive }) => ({
  width: 12,
  height: 2,
  borderRadius: 1,
  backgroundColor: isActive ? colors.white : colors.gray03,
}));

export const ViewModeToggle = memo(ViewModeToggleComponent);
export type { ViewModeToggleProps };
