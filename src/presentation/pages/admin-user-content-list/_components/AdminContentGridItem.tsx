/**
 * AdminContentGridItem - 어드민용 콘텐츠 그리드 아이템
 *
 * 포스터 이미지와 더보기 버튼을 표시합니다.
 * 더보기 버튼 클릭 시 푸시 알림 플로우로 이동합니다.
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from '@emotion/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import type { RootStackParamList } from '@/shared/navigation/types';
import { routePages } from '@/shared/navigation/constant/routePages';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { AppSize } from '@/shared/utils/appSize';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import type { UserContentItem } from '@/features/admin';

// ============================================================================
// Constants
// ============================================================================

// 3열 그리드 상수
export const GRID_ITEM_WIDTH = (AppSize.screenWidth - 32 - 18) / 3;
export const GRID_POSTER_HEIGHT = GRID_ITEM_WIDTH * 1.5;

const MORE_ICON_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="5" r="2" fill="${colors.white}"/>
<circle cx="12" cy="12" r="2" fill="${colors.white}"/>
<circle cx="12" cy="19" r="2" fill="${colors.white}"/>
</svg>
`;

const BELL_ICON_SVG = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="${colors.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// ============================================================================
// Types
// ============================================================================

interface AdminContentGridItemProps {
  readonly item: UserContentItem;
  readonly showRating?: boolean;
  readonly showProgress?: boolean;
  readonly onActionPress: () => void;
}

// ============================================================================
// Component
// ============================================================================

function AdminContentGridItem({
  item,
  showRating = false,
  showProgress = false,
  onActionPress,
}: AdminContentGridItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const posterUrl = item.contentPosterPath
    ? formatter.prefixTmdbImgUrl(item.contentPosterPath, { size: TmdbImageSize.w342 })
    : null;

  const handlePress = useCallback(() => {
    navigation.push(routePages.contentDetail, {
      id: item.contentId,
      title: item.contentTitle,
      type: item.contentType,
    });
  }, [navigation, item.contentId, item.contentTitle, item.contentType]);

  return (
    <Container>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <PosterWrapper>
          <LoadableImageView
            source={posterUrl ?? ''}
            width={GRID_ITEM_WIDTH}
            height={GRID_POSTER_HEIGHT}
            borderRadius={4}
          />

          {/* 별점 오버레이 (평가 탭) */}
          {showRating && item.rating != null && (
            <RatingOverlay>
              <RatingText>{item.rating.toFixed(1)}</RatingText>
            </RatingOverlay>
          )}

          {/* 시청 진행률 오버레이 (시청기록 탭) */}
          {showProgress && item.progressPercent != null && (
            <ProgressOverlay>
              <ProgressText>{item.progressPercent}%</ProgressText>
            </ProgressOverlay>
          )}
        </PosterWrapper>
      </TouchableOpacity>

      {/* 푸시 버튼 */}
      <ActionButton onPress={onActionPress}>
        <SvgXml xml={BELL_ICON_SVG} width={14} height={14} />
        <ActionButtonText>푸시</ActionButtonText>
      </ActionButton>
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled(View)({
  width: GRID_ITEM_WIDTH,
  marginBottom: 16,
});

const PosterWrapper = styled(View)({
  position: 'relative',
});

const RatingOverlay = styled(View)({
  position: 'absolute',
  bottom: 4,
  left: 4,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
});

const RatingText = styled.Text({
  ...textStyles.alert2,
  color: colors.primary,
  fontWeight: '600',
});

const ProgressOverlay = styled(View)({
  position: 'absolute',
  bottom: 4,
  left: 4,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
});

const ProgressText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontWeight: '600',
});

const ActionButton = styled(TouchableOpacity)({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  marginTop: 6,
  paddingVertical: 6,
  backgroundColor: colors.gray05,
  borderRadius: 4,
});

const ActionButtonText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});

export const MemoizedAdminContentGridItem = React.memo(AdminContentGridItem);
export { AdminContentGridItem };
