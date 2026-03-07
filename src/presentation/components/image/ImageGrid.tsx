import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { TmdbImageItemDto } from '@/features/tmdb/types/imageDto';
import { LoadableImageView } from './LoadableImageView';
import { formatter, TmdbImageSize } from '@/core/utils/formatter';

interface ImageGridProps {
  /** 표시할 이미지 목록 */
  readonly images: TmdbImageItemDto[];
  /** 개별 이미지 너비 (px) */
  readonly itemWidth: number;
  /** 개별 이미지 높이 (px) */
  readonly itemHeight: number;
  /** 이미지 간 간격 (px) */
  readonly gap: number;
  /** 이미지 클릭 시 호출되는 콜백 (원본 배열 기준 인덱스) */
  readonly onImagePress: (index: number) => void;
  /** 원본 배열에서의 시작 인덱스 오프셋 (기본값: 0) */
  readonly indexOffset?: number;
}

/**
 * ImageGrid - 2열 그리드로 TMDB 이미지를 표시하는 공통 컴포넌트
 *
 * MediaSectionView와 MediaListPage에서 공유하는 2열 이미지 그리드 레이아웃입니다.
 * 이미지를 행 단위로 묶어 렌더링하며, 각 이미지는 터치 시 onImagePress를 호출합니다.
 */
function ImageGridComponent({
  images,
  itemWidth,
  itemHeight,
  gap,
  onImagePress,
  indexOffset = 0,
}: ImageGridProps) {
  const rows = useMemo(() => {
    const result: { left: TmdbImageItemDto; right?: TmdbImageItemDto }[] = [];
    for (let i = 0; i < images.length; i += 2) {
      const left = images[i];
      if (!left) continue;
      const right = images[i + 1];
      result.push(right ? { left, right } : { left });
    }
    return result;
  }, [images]);

  const handlePress = useCallback(
    (index: number) => {
      onImagePress(index + indexOffset);
    },
    [onImagePress, indexOffset],
  );

  if (images.length === 0) return null;

  return (
    <>
      {rows.map((row, rowIndex) => (
        <GridRow key={row.left.filePath} gap={gap}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => handlePress(rowIndex * 2)}>
            <LoadableImageView
              source={formatter.prefixTmdbImgUrl(row.left.filePath, {
                size: TmdbImageSize.w780,
              })}
              width={itemWidth}
              height={itemHeight}
              borderRadius={4}
            />
          </TouchableOpacity>

          {row.right && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePress(rowIndex * 2 + 1)}
              style={{ marginLeft: gap }}
            >
              <LoadableImageView
                source={formatter.prefixTmdbImgUrl(row.right.filePath, {
                  size: TmdbImageSize.w780,
                })}
                width={itemWidth}
                height={itemHeight}
                borderRadius={4}
              />
            </TouchableOpacity>
          )}
        </GridRow>
      ))}
    </>
  );
}

const GridRow = styled.View<{ gap: number }>(({ gap }) => ({
  flexDirection: 'row',
  marginBottom: gap,
}));

export const ImageGrid = React.memo(ImageGridComponent);
ImageGrid.displayName = 'ImageGrid';
