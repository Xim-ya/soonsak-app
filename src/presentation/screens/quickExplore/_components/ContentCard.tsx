/**
 * ContentCard - 빠른탐색 페이지용 콘텐츠 카드
 *
 * 포스터 이미지와 제목, 평점 칩을 표시하는 카드 컴포넌트입니다.
 * 드래그 가능한 그리드에서 사용됩니다.
 * 포커스 상태일 때 글로우 효과가 적용됩니다.
 *
 * @example
 * <ContentCard
 *   content={content}
 *   onPress={() => handleContentPress(content)}
 *   isFocused={false}
 * />
 */

import { memo } from 'react';
import styled from '@emotion/native';
import { TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { AppSize } from '@/shared/utils/appSize';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { BaseContentModel } from '@/presentation/types/content/baseContentModel';
import { contentTypeConfigs } from '@/shared/types/content/contentType.enum';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';

interface ContentCardProps {
  content: BaseContentModel;
  onPress?: () => void;
  isFocused?: boolean;
}

function ContentCardComponent({ content, onPress, isFocused = false }: ContentCardProps) {
  const cardWidth = AppSize.ratioWidth(200);
  const cardHeight = AppSize.ratioHeight(344);
  const borderRadius = AppSize.ratioWidth(40);
  const padding = AppSize.ratioWidth(16);

  const posterUrl = formatter.prefixTmdbImgUrl(content.posterPath ?? '', {
    size: TmdbImageSize.w500,
  });

  return (
    // iOS에서 overflow: 'hidden'과 shadow를 같은 View에 적용하면 CALayer 오프스크린
    // 렌더링이 발생합니다. shadow는 외부 ShadowWrapper에, overflow는 내부 CardContainer에 분리합니다.
    <ShadowWrapper cardWidth={cardWidth} cardHeight={cardHeight} borderRadius={borderRadius}>
      <CardContainer
        onPress={onPress}
        activeOpacity={0.9}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        borderRadius={borderRadius}
      >
        {/* 포스터 이미지 */}
        {posterUrl ? (
          <LoadableImageView
            source={posterUrl}
            width={cardWidth}
            height={cardHeight}
            borderRadius={borderRadius}
          />
        ) : (
          <PosterPlaceholder
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            borderRadius={borderRadius}
          />
        )}

        {/* 하단 그라데이션 오버레이 */}
        <GradientOverlay
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
          locations={[0.5, 1]}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          borderRadius={borderRadius}
        />

        {/* 콘텐츠 정보 */}
        <ContentInfo padding={padding}>
          {/* 콘텐츠 타입 칩 */}
          <TypeChip>
            <TypeChipText>{contentTypeConfigs[content.type].label}</TypeChipText>
          </TypeChip>

          {/* 제목 */}
          <TitleText numberOfLines={2}>{content.title}</TitleText>
        </ContentInfo>

        {/* 포커스 상태일 때 브랜드 색상 테두리 */}
        {isFocused && (
          <FocusBorder cardWidth={cardWidth} cardHeight={cardHeight} borderRadius={borderRadius} />
        )}
      </CardContainer>
    </ShadowWrapper>
  );
}

/* Styled Components */

// iOS에서 shadow는 overflow: 'hidden'이 없는 별도 View에서만 올바르게 렌더링됩니다.
// overflow: 'hidden'과 shadow를 함께 사용하면 CALayer 오프스크린 렌더링을 유발하므로
// ShadowWrapper에서 shadow를, CardContainer에서 overflow를 각각 담당합니다.
const ShadowWrapper = styled.View<{
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
}>(({ cardWidth, cardHeight, borderRadius }) => ({
  width: cardWidth,
  height: cardHeight,
  borderRadius,
  margin: AppSize.ratioWidth(10),
  ...Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
}));

const CardContainer = styled(TouchableOpacity)<{
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
}>(({ cardWidth, cardHeight, borderRadius }) => ({
  width: cardWidth,
  height: cardHeight,
  borderRadius,
  overflow: 'hidden',
  position: 'relative',
}));

const GradientOverlay = styled(LinearGradient)<{
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
}>(({ cardWidth, cardHeight, borderRadius }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: cardWidth,
  height: cardHeight * 0.5,
  borderBottomLeftRadius: borderRadius,
  borderBottomRightRadius: borderRadius,
}));

const ContentInfo = styled.View<{ padding: number }>(({ padding }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding,
}));

const TypeChip = styled.View({
  backgroundColor: colors.yellow,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 10,
  alignSelf: 'flex-start',
  marginBottom: 8,
});

const TypeChipText = styled.Text({
  ...textStyles.alert1,
  color: colors.black,
});

const TitleText = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const PosterPlaceholder = styled.View<{
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
}>(({ cardWidth, cardHeight, borderRadius }) => ({
  width: cardWidth,
  height: cardHeight,
  borderRadius,
  backgroundColor: colors.gray05,
}));

// 포커스 테두리
const FocusBorder = styled.View<{
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
}>(({ cardWidth, cardHeight, borderRadius }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: cardWidth,
  height: cardHeight,
  borderRadius,
  borderWidth: 3,
  borderColor: colors.yellow,
}));

// content.id와 isFocused가 같으면 리렌더링 방지
const ContentCard = memo(ContentCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.content.id === nextProps.content.id && prevProps.isFocused === nextProps.isFocused
  );
});

export { ContentCard };
export type { ContentCardProps };
