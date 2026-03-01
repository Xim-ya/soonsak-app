/**
 * UserDetail Model
 *
 * 유저 상세 정보의 도메인 모델
 * DTO를 UI 친화적인 형태로 변환하여 사용합니다.
 */

import type { UserDetailItem } from '@/features/admin';
import type { UserRole } from '@/features/auth/types';

/** 푸시 토큰 모델 */
export interface PushTokenModel {
  readonly id: string;
  readonly token: string;
  readonly platform: 'ios' | 'android';
  readonly isActive: boolean;
  readonly createdAt: string;
}

/** 유저 상세 모델 */
export interface UserDetailModel {
  readonly id: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly role: UserRole;
  readonly entryCount: number;
  readonly createdAt: string;
  readonly lastLoginAt: string | null;
  readonly providers: string[];
  readonly pushTokens: PushTokenModel[];
  readonly watchHistoryCount: number;
  readonly favoritesCount: number;
  readonly ratingsCount: number;
}

/**
 * DTO를 Model로 변환
 */
export function userDetailFromDto(dto: UserDetailItem): UserDetailModel {
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
    pushTokens: dto.pushTokens.map((token) => ({
      id: token.id,
      token: token.token,
      platform: token.platform,
      isActive: token.isActive,
      createdAt: token.createdAt,
    })),
    watchHistoryCount: dto.watchHistoryCount,
    favoritesCount: dto.favoritesCount,
    ratingsCount: dto.ratingsCount,
  };
}
