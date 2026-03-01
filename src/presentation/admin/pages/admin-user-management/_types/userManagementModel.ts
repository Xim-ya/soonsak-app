/**
 * UserManagementModel - 유저 관리 아이템 모델
 *
 * 유저 관리 페이지에서 사용되는 유저 정보 데이터 모델
 * Feature layer의 DTO를 Presentation layer의 Model로 변환
 */

import type { UserRole } from '@/features/auth/types';
import type { UserManagementItem as UserManagementItemDto } from '@/features/admin';

/**
 * 유저 관리 목록 아이템 모델
 */
export interface UserManagementModel {
  /** 유저 ID */
  readonly id: string;
  /** 이메일 */
  readonly email: string | null;
  /** 표시 이름 */
  readonly displayName: string | null;
  /** 아바타 이미지 URL */
  readonly avatarUrl: string | null;
  /** 유저 역할 */
  readonly role: UserRole;
  /** 앱 방문 횟수 */
  readonly entryCount: number;
  /** 가입일 */
  readonly createdAt: string;
  /** 마지막 로그인 일시 */
  readonly lastLoginAt: string | null;
  /** 로그인 제공자 목록 */
  readonly providers: string[];
}

/* eslint-disable @typescript-eslint/no-namespace */
export namespace UserManagementModel {
  /**
   * Feature DTO를 Presentation Model로 변환
   * @param dto UserManagementItemDto (from feature/admin API)
   * @returns UserManagementModel
   */
  export function fromDto(dto: UserManagementItemDto): UserManagementModel {
    return {
      id: dto.id,
      email: dto.email,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      role: dto.role,
      entryCount: dto.entryCount,
      createdAt: dto.createdAt,
      lastLoginAt: dto.lastLoginAt,
      providers: dto.providers,
    };
  }

  /**
   * 여러 DTO를 한 번에 변환
   * @param dtos UserManagementItemDto 배열
   * @returns UserManagementModel 배열
   */
  export function fromDtos(dtos: UserManagementItemDto[]): UserManagementModel[] {
    return dtos.map(fromDto);
  }
}
