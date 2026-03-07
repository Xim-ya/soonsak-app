import React, { useState, useEffect } from 'react';
import { LayoutChangeEvent, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { LinearGradient } from 'expo-linear-gradient';
import textStyles from '@/presentation/styles/textStyles';
import colors from '@/presentation/styles/colors';
import Gap from '../view/Gap';

interface ExpandableTextViewProps {
  text: string;
  maxLines: number;
  isLoading?: boolean;
}

export const ExpandableTextView: React.FC<ExpandableTextViewProps> = ({
  text,
  maxLines,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const [collapsedHeight, setCollapsedHeight] = useState(0);

  // 두 높이가 모두 설정되었을 때 overflow 상태 확인
  useEffect(() => {
    if (collapsedHeight > 0 && textHeight > 0) {
      // 높이 차이가 2px 이상일 때만 overflow로 판정 (측정 오차 고려)
      setIsTextOverflowing(textHeight - collapsedHeight > 2);
    }
  }, [collapsedHeight, textHeight]);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    if (!isExpanded && collapsedHeight === 0) {
      setCollapsedHeight(event.nativeEvent.layout.height);
    }
  };

  const handleFullTextLayout = (event: LayoutChangeEvent) => {
    const fullHeight = event.nativeEvent.layout.height;
    setTextHeight(fullHeight);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // 로딩 상태일 때 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <SkeletonContainer>
        <Gap size={1} />
        <SkeletonBox />
        <SkeletonBox />
        <SkeletonBox />
      </SkeletonContainer>
    );
  }

  // 텍스트가 없을 때
  if (!text) {
    return null;
  }

  return (
    <Container>
      <TextContainer>
        <ContentText numberOfLines={isExpanded ? undefined : maxLines} onLayout={handleTextLayout}>
          {text}
        </ContentText>

        {/* 숨겨진 전체 텍스트로 높이 측정 */}
        <HiddenText onLayout={handleFullTextLayout}>{text}</HiddenText>
      </TextContainer>

      {isTextOverflowing && (
        <ToggleContainer>
          <GradientOverlay
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 1)']}
            locations={[0, 0.36, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <ToggleButton onPress={toggleExpanded}>
            <ToggleText>{isExpanded ? '접기' : '더보기'}</ToggleText>
          </ToggleButton>
        </ToggleContainer>
      )}
    </Container>
  );
};

/* Styled Components */
const Container = styled.View({
  position: 'relative',
});

const TextContainer = styled.View({
  marginBottom: 21,
});

const ContentText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,

  lineHeight: 20.5,
});

const HiddenText = styled.Text({
  position: 'absolute',
  opacity: 0,
  ...textStyles.alert2,
  lineHeight: 20.5, // ContentText와 동일하게 맞춤
});

const ToggleContainer = styled.View({
  position: 'absolute',
  right: 0,
  bottom: 20, // 항상 일정한 위치에 표시
  height: 20,
  flexDirection: 'row',
  alignItems: 'center',
  paddingLeft: 40, // 그라데이션 영역 확보
});

const GradientOverlay = styled(LinearGradient)({
  position: 'absolute',
  left: -40,
  right: 0,
  top: 0,
  bottom: 0,
});

const ToggleButton = styled(TouchableOpacity)({
  paddingHorizontal: 4,
  paddingVertical: 2,
  zIndex: 1,
  backgroundColor: colors.black, // 텍스트 가독성을 위한 배경
});

const ToggleText = styled.Text({
  ...textStyles.alert1,
  color: colors.green,
  fontWeight: '600',
});

// 스켈레톤 UI 컴포넌트
const SkeletonContainer = styled.View({
  gap: 0,
  marginBottom: 14,
});

const SkeletonBox = styled.View({
  height: 14.5, // ContentText의 lineHeight와 동일하게 설정
  backgroundColor: colors.gray05,
  borderRadius: 4,
  marginBottom: 8,
});
