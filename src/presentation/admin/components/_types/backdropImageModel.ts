import type { TmdbImageItemDto } from '@/features/tmdb/types/imageDto';

/**
 * BackdropImageModel - 백드롭 이미지 UI 모델
 *
 * TMDB의 이미지 DTO를 UI 레이어에서 사용하기 위한 모델
 * 선택 모달에서 필요한 필드만 포함
 */
export interface BackdropImageModel {
  /** 이미지 파일 경로 */
  readonly filePath: string;
  /** 이미지 종횡비 */
  readonly aspectRatio: number;
  /** 이미지 너비 */
  readonly width: number;
  /** 이미지 높이 */
  readonly height: number;
}

/**
 * TMDB 이미지 DTO를 UI 모델로 변환
 *
 * @param dto - TMDB 이미지 DTO
 * @returns BackdropImageModel UI 모델
 */
export function fromDto(dto: TmdbImageItemDto): BackdropImageModel {
  return {
    filePath: dto.filePath,
    aspectRatio: dto.aspectRatio,
    width: dto.width,
    height: dto.height,
  };
}

/**
 * TMDB 이미지 DTO 배열을 UI 모델 배열로 변환
 *
 * @param dtos - TMDB 이미지 DTO 배열
 * @returns BackdropImageModel 배열
 */
export function fromDtos(dtos: TmdbImageItemDto[]): BackdropImageModel[] {
  return dtos.map(fromDto);
}
