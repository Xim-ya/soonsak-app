/**
 * ChannelGridItem - 채널 그리드 아이템 공통 컴포넌트
 *
 * 채널 로고, 이름, 구독자 수를 표시하는 그리드 아이템입니다.
 * 선택 가능 여부와 구독자 수 표시 여부를 props로 제어할 수 있습니다.
 *
 * 사용처:
 * - ChannelAllPage: 전체 채널 목록 (선택 불가, 구독자 수 표시)
 * - ChannelFilterTab: 필터 바텀시트 채널 선택 (선택 가능, 구독자 수 미표시)
 *
 * @example
 * // 채널 목록용 (선택 불가)
 * <ChannelGridItem
 *   logoUrl="https://..."
 *   name="채널명"
 *   subscriberCount={10000}
 *   avatarSize={80}
 *   itemWidth={100}
 *   onPress={() => navigateToDetail()}
 * />
 *
 * @example
 * // 필터 선택용 (선택 가능)
 * <ChannelGridItem
 *   logoUrl="https://..."
 *   name="채널명"
 *   avatarSize={72}
 *   itemWidth={80}
 *   isSelected={true}
 *   selectable
 *   onPress={() => toggleSelection()}
 * />
 */

import React, { memo } from 'react';
import styled from '@emotion/native';
import textStyles from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';
import { formatter } from '@/core/utils/formatter';
import { ChannelLogoImage } from '@/presentation/components/image/ChannelLogoImage';
import { ChannelAvatarWrapper } from './ChannelAvatarWrapper';

// ============================================================================
// Types
// ============================================================================

interface ChannelGridItemProps {
  /** 채널 로고 URL */
  readonly logoUrl?: string;
  /** 채널명 */
  readonly name: string;
  /** 구독자 수 (undefined일 경우 미표시) */
  readonly subscriberCount?: number | undefined;
  /** 아바타 크기 */
  readonly avatarSize: number;
  /** 아이템 전체 너비 */
  readonly itemWidth: number;
  /** 클릭 콜백 */
  readonly onPress: () => void;
  /** 선택 가능 여부 (true일 경우 선택 UI 표시) */
  readonly selectable?: boolean;
  /** 선택 상태 (selectable이 true일 때만 유효) */
  readonly isSelected?: boolean;
}

// ============================================================================
// Component
// ============================================================================

function ChannelGridItemComponent({
  logoUrl,
  name,
  subscriberCount,
  avatarSize,
  itemWidth,
  onPress,
  selectable = false,
  isSelected = false,
}: ChannelGridItemProps): React.ReactElement {
  // 구독자 수 포맷팅
  const subscriberText =
    subscriberCount != null ? `${formatter.formatNumberWithUnit(subscriberCount)}명` : '';

  // 선택 가능 모드와 일반 모드에서 텍스트 스타일 분리
  const nameColor = selectable ? (isSelected ? colors.white : colors.gray03) : colors.white;

  return (
    <Container style={{ width: itemWidth }} onPress={onPress} activeOpacity={0.7}>
      {selectable ? (
        <ChannelAvatarWrapper isSelected={isSelected} avatarSize={avatarSize}>
          <ChannelLogoImage source={logoUrl ?? ''} size={avatarSize} />
        </ChannelAvatarWrapper>
      ) : (
        <ChannelLogoImage source={logoUrl} size={avatarSize} />
      )}
      <ChannelName numberOfLines={1} selectable={selectable} style={{ color: nameColor }}>
        {name}
      </ChannelName>
      {subscriberText !== '' && <SubscriberText>{subscriberText}</SubscriberText>}
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.TouchableOpacity({
  alignItems: 'center',
});

/**
 * 채널명 텍스트
 * - selectable=true: textStyles.desc (12px, 필터 선택용)
 * - selectable=false: textStyles.alert1 (13px, 목록용)
 */
const ChannelName = styled.Text<{ selectable: boolean }>(({ selectable }) => ({
  ...(selectable ? textStyles.desc : textStyles.alert1),
  marginTop: selectable ? 4 : 8,
  textAlign: 'center',
}));

const SubscriberText = styled.Text({
  ...textStyles.alert2,
  color: colors.gray03,
  marginTop: 2,
});

// ============================================================================
// Export
// ============================================================================

export const ChannelGridItem = memo(ChannelGridItemComponent);
export type { ChannelGridItemProps };
