import type { ChannelDto } from '@/features/channel/types';

/**
 * ChannelSelectionModel - 채널 선택 페이지 UI 모델
 *
 * ChannelDto를 채널 선택 화면에서 필요한 필드만 포함하도록 변환한 모델입니다.
 * UI 렌더링에 필요한 최소한의 정보(id, name, logoUrl, subscriberCount)만 포함합니다.
 */
export interface ChannelSelectionModel {
  /** 채널 고유 ID */
  readonly id: string;
  /** 채널명 */
  readonly name: string;
  /** 채널 로고 URL */
  readonly logoUrl: string | null;
  /** 구독자 수 */
  readonly subscriberCount: number | null;
}

/**
 * ChannelDto를 ChannelSelectionModel로 변환
 *
 * @param dto - 원본 ChannelDto
 * @returns UI 모델로 변환된 ChannelSelectionModel
 */
export function channelSelectionFromDto(dto: ChannelDto): ChannelSelectionModel {
  return {
    id: dto.id,
    name: dto.name ?? '',
    logoUrl: dto.logoUrl,
    subscriberCount: dto.subscriberCount,
  };
}

/**
 * ChannelDto 배열을 ChannelSelectionModel 배열로 변환
 *
 * @param dtos - ChannelDto 배열
 * @returns ChannelSelectionModel 배열
 */
export function channelSelectionFromDtos(dtos: ChannelDto[]): ChannelSelectionModel[] {
  return dtos.map(channelSelectionFromDto);
}
