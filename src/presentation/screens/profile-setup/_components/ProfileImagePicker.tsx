/**
 * ProfileImagePicker - 프로필 이미지 선택 컴포넌트
 *
 * 프로필 이미지를 표시하고 변경할 수 있는 컴포넌트입니다.
 * 이미지 터치 시 갤러리에서 새 이미지를 선택할 수 있습니다.
 *
 * @example
 * <ProfileImagePicker
 *   imageUrl={avatarUrl}
 *   onPress={handlePickImage}
 * />
 */

import React, { useState, useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import styled from '@emotion/native';
import { SvgXml } from 'react-native-svg';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

/** 레이아웃 상수 */
const IMAGE_SIZE = 100;
const BADGE_SIZE = 32;

/** 카메라 아이콘 SVG */
const cameraIconSvg = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z" fill="white"/>
<path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="white"/>
</svg>
`;

/** 기본 프로필 아이콘 SVG */
const defaultProfileSvg = `
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="ICON_COLOR"/>
</svg>
`;

interface ProfileImagePickerProps {
  /** 프로필 이미지 URL */
  readonly imageUrl: string | undefined;
  /** 이미지 선택 핸들러 */
  readonly onPress: () => void;
}

function ProfileImagePicker({ imageUrl, onPress }: ProfileImagePickerProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hasValidImage = imageUrl !== undefined && imageUrl.trim() !== '';

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const defaultIconWithColor = defaultProfileSvg.replace('ICON_COLOR', colors.gray02);

  return (
    <Container>
      <ImageButton onPress={onPress} activeOpacity={0.8}>
        {/* 배경 / 플레이스홀더 */}
        <ImageContainer>
          {/* 로딩 중 또는 이미지 없음 */}
          {(!hasValidImage || isLoading || hasError) && (
            <PlaceholderContainer>
              <SvgXml xml={defaultIconWithColor} width={48} height={48} />
            </PlaceholderContainer>
          )}

          {/* 실제 이미지 */}
          {hasValidImage && !hasError && (
            <AnimatedImage
              source={{ uri: imageUrl }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ opacity: fadeAnim }}
            />
          )}
        </ImageContainer>

        {/* 카메라 배지 */}
        <CameraBadge>
          <SvgXml xml={cameraIconSvg} width={18} height={18} />
        </CameraBadge>
      </ImageButton>

      {/* 변경 텍스트 */}
      <ChangeText>사진 변경</ChangeText>
    </Container>
  );
}

/* Styled Components */

const Container = styled.View({
  alignItems: 'center',
});

const ImageButton = styled(TouchableOpacity)({
  position: 'relative',
});

const ImageContainer = styled.View({
  width: IMAGE_SIZE,
  height: IMAGE_SIZE,
  borderRadius: IMAGE_SIZE / 2,
  backgroundColor: colors.gray05,
  overflow: 'hidden',
  justifyContent: 'center',
  alignItems: 'center',
});

const PlaceholderContainer = styled.View({
  position: 'absolute',
  width: IMAGE_SIZE,
  height: IMAGE_SIZE,
  justifyContent: 'center',
  alignItems: 'center',
});

const AnimatedImage = styled(Animated.Image)({
  width: IMAGE_SIZE,
  height: IMAGE_SIZE,
});

const CameraBadge = styled.View({
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: BADGE_SIZE,
  height: BADGE_SIZE,
  borderRadius: BADGE_SIZE / 2,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: colors.black,
});

const ChangeText = styled.Text({
  ...textStyles.alert1,
  color: colors.gray01,
  marginTop: 12,
});

export { ProfileImagePicker };
