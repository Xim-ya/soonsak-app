/**
 * BackdropSelectionModal - 메인 이미지(backdrop) 선택 모달
 *
 * TMDB에서 제공하는 backdrop 이미지 목록을 보여주고
 * 관리자가 콘텐츠의 메인 이미지를 선택할 수 있는 모달
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Modal, FlatList, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import styled from '@emotion/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';
import { formatter, TmdbImageSize } from '@/shared/utils/formatter';
import { useContentImages } from '@/features/tmdb/hooks/useContentImages';
import type { ContentType } from '@/presentation/types/content/contentType.enum';
import type { BackdropImageModel } from './_types/backdropImageModel';
import { fromDtos } from './_types/backdropImageModel';
import { LoadableImageView } from '@/presentation/components/image/LoadableImageView';
import { AppSize } from '@/shared/utils/appSize';

const MODAL_HORIZONTAL_PADDING = 16;
const IMAGE_GAP = 8;
const COLUMNS = 2;
const IMAGE_ASPECT_RATIO = 16 / 9;

interface BackdropSelectionModalProps {
  /** 모달 표시 여부 */
  readonly visible: boolean;
  /** 콘텐츠 ID */
  readonly contentId: number;
  /** 콘텐츠 타입 */
  readonly contentType: ContentType;
  /** 현재 선택된 backdrop path */
  readonly currentBackdropPath: string | undefined;
  /** 선택 완료 콜백 */
  readonly onSelect: (backdropPath: string) => void;
  /** 닫기 콜백 */
  readonly onClose: () => void;
  /** 저장 중 여부 */
  readonly isSaving?: boolean;
}

function BackdropSelectionModal({
  visible,
  contentId,
  contentType,
  currentBackdropPath,
  onSelect,
  onClose,
  isSaving = false,
}: BackdropSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // TMDB 이미지 목록 조회
  const { data: imagesDto, isLoading, error } = useContentImages(contentId, contentType);

  // DTO를 UI 모델로 변환
  const images = useMemo(() => {
    if (!imagesDto) return [];
    return fromDtos(imagesDto);
  }, [imagesDto]);

  // 이미지 너비 계산 (2열 그리드)
  const containerWidth = AppSize.screenWidth - MODAL_HORIZONTAL_PADDING * 2;
  const imageWidth = (containerWidth - IMAGE_GAP) / COLUMNS;
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO;

  // 이미지 선택 핸들러
  const handleImagePress = useCallback((filePath: string) => {
    setSelectedPath(filePath);
  }, []);

  // 확인 버튼 핸들러
  const handleConfirm = useCallback(() => {
    if (selectedPath) {
      onSelect(selectedPath);
    }
  }, [selectedPath, onSelect]);

  // 선택 상태 확인
  const isSelected = useCallback(
    (filePath: string) => {
      if (selectedPath) {
        return selectedPath === filePath;
      }
      return currentBackdropPath === filePath;
    },
    [selectedPath, currentBackdropPath],
  );

  // 이미지 렌더링
  const renderImage = useCallback(
    ({ item }: { item: BackdropImageModel }) => {
      const imageUrl = formatter.prefixTmdbImgUrl(item.filePath, { size: TmdbImageSize.w500 });
      const selected = isSelected(item.filePath);
      const isCurrent = currentBackdropPath === item.filePath;

      return (
        <ImageItemContainer
          onPress={() => handleImagePress(item.filePath)}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          <ImageWrapper width={imageWidth} height={imageHeight}>
            <LoadableImageView
              source={imageUrl}
              width={imageWidth}
              height={imageHeight}
              borderRadius={8}
            />
            {/* 선택 상태 오버레이 */}
            {selected && (
              <SelectionOverlay>
                <SelectionIndicator>
                  <SelectionIndicatorText>✓</SelectionIndicatorText>
                </SelectionIndicator>
              </SelectionOverlay>
            )}
            {/* 현재 활성 배지 */}
            {isCurrent && !selectedPath && (
              <CurrentBadge>
                <CurrentBadgeText>현재</CurrentBadgeText>
              </CurrentBadge>
            )}
          </ImageWrapper>
        </ImageItemContainer>
      );
    },
    [
      imageWidth,
      imageHeight,
      currentBackdropPath,
      selectedPath,
      handleImagePress,
      isSaving,
      isSelected,
    ],
  );

  // 빈 상태 렌더링
  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <EmptyContainer>
          <ActivityIndicator size="large" color={colors.primary} />
          <EmptyText>이미지를 불러오는 중...</EmptyText>
        </EmptyContainer>
      );
    }

    if (error) {
      return (
        <EmptyContainer>
          <EmptyText>이미지를 불러올 수 없습니다</EmptyText>
        </EmptyContainer>
      );
    }

    return (
      <EmptyContainer>
        <EmptyText>사용 가능한 이미지가 없습니다</EmptyText>
      </EmptyContainer>
    );
  }, [isLoading, error]);

  // 선택 가능한 상태 확인
  const canConfirm = selectedPath && selectedPath !== currentBackdropPath;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Overlay />
      </TouchableWithoutFeedback>

      <ModalContainer paddingBottom={insets.bottom}>
        {/* 헤더 */}
        <HeaderContainer>
          <HandleBar />
          <HeaderRow>
            <AdminBadge>
              <AdminBadgeText>관리자</AdminBadgeText>
            </AdminBadge>
            <HeaderTitle>메인 이미지 선택</HeaderTitle>
          </HeaderRow>
          <HeaderSubtitle>콘텐츠 상세 페이지에 표시될 배경 이미지를 선택하세요</HeaderSubtitle>
        </HeaderContainer>

        {/* 이미지 그리드 */}
        <FlatList
          data={images}
          renderItem={renderImage}
          keyExtractor={(item) => item.filePath}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: IMAGE_GAP }}
          contentContainerStyle={{ paddingHorizontal: MODAL_HORIZONTAL_PADDING, paddingBottom: 16 }}
          ItemSeparatorComponent={() => <ItemSeparator />}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />

        {/* 하단 버튼 */}
        <ButtonContainer>
          <CancelButton onPress={onClose} activeOpacity={0.7} disabled={isSaving}>
            <CancelButtonText>취소</CancelButtonText>
          </CancelButton>
          <ConfirmButton
            onPress={handleConfirm}
            activeOpacity={0.7}
            disabled={!canConfirm || isSaving}
            isDisabled={!canConfirm || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <ConfirmButtonText>변경하기</ConfirmButtonText>
            )}
          </ConfirmButton>
        </ButtonContainer>
      </ModalContainer>
    </Modal>
  );
}

/* Styled Components */

const Overlay = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.overlay,
});

const ModalContainer = styled.View<{ paddingBottom: number }>(({ paddingBottom }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.gray06,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: '85%',
  paddingBottom: Math.max(paddingBottom, 16),
}));

const HeaderContainer = styled.View({
  alignItems: 'center',
  paddingTop: 12,
  paddingBottom: 16,
  paddingHorizontal: 16,
});

const HandleBar = styled.View({
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.gray03,
  marginBottom: 16,
});

const HeaderRow = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
});

const AdminBadge = styled.View({
  backgroundColor: colors.primary,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 4,
});

const AdminBadgeText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
  fontWeight: '600',
});

const HeaderTitle = styled.Text({
  ...textStyles.title1,
  color: colors.white,
});

const HeaderSubtitle = styled.Text({
  ...textStyles.body3,
  color: colors.gray02,
  textAlign: 'center',
});

const ImageItemContainer = styled.TouchableOpacity({
  flex: 1,
});

const ImageWrapper = styled.View<{ width: number; height: number }>(({ width, height }) => ({
  width,
  height,
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
}));

const SelectionOverlay = styled.View({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(139, 92, 246, 0.4)',
  borderRadius: 8,
  borderWidth: 3,
  borderColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
});

const SelectionIndicator = styled.View({
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
});

const SelectionIndicatorText = styled.Text({
  fontSize: 20,
  color: colors.white,
  fontWeight: 'bold',
});

const CurrentBadge = styled.View({
  position: 'absolute',
  top: 6,
  left: 6,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
});

const CurrentBadgeText = styled.Text({
  ...textStyles.alert2,
  color: colors.white,
});

const ItemSeparator = styled.View({
  height: IMAGE_GAP,
});

const EmptyContainer = styled.View({
  paddingVertical: 60,
  alignItems: 'center',
  justifyContent: 'center',
});

const EmptyText = styled.Text({
  ...textStyles.body2,
  color: colors.gray02,
  marginTop: 12,
});

const ButtonContainer = styled.View({
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingTop: 12,
  gap: 12,
});

const CancelButton = styled.TouchableOpacity({
  flex: 1,
  height: 48,
  backgroundColor: colors.gray05,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
});

const CancelButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
});

const ConfirmButton = styled.TouchableOpacity<{ isDisabled: boolean }>(({ isDisabled }) => ({
  flex: 1,
  height: 48,
  backgroundColor: isDisabled ? colors.gray04 : colors.primary,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
}));

const ConfirmButtonText = styled.Text({
  ...textStyles.body2,
  color: colors.white,
  fontWeight: '600',
});

export { BackdropSelectionModal };
