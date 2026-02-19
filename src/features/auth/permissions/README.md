# features/auth/permissions

권한(Permission) 시스템

## 구조

```
permissions/
├── permissionTypes.ts      # Permission 타입 및 ROLE_PERMISSIONS 매핑
├── permissionChecker.ts    # 권한 검사 유틸리티
└── index.ts                # Public exports
```

## 파일별 역할

### permissionTypes.ts

```typescript
export type Permission =
  | 'content:view'
  | 'content:edit'
  | 'content:delete'
  | 'content:manage'
  | 'user:view_profile'
  | 'user:manage_users'
  | 'system:view_analytics';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  user: ['content:view', 'user:view_profile'],
  admin: ['content:view', 'content:edit', 'content:delete', /* ... */],
  banned: [],
  // 향후 확장
  // moderator: ['content:view', 'content:edit'],
  // premium: ['content:view', 'content:view_premium'],
};
```

### permissionChecker.ts

```typescript
export const PermissionChecker = {
  hasPermission(role: UserRole, permission: Permission): boolean,
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean,
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean,
};
```

## 사용 방법

```typescript
// shared/hooks/usePermission.ts 에서 사용
import { PermissionChecker } from '@/features/auth/permissions';

const can = (permission: Permission) =>
  PermissionChecker.hasPermission(role, permission);
```

## 역할 추가 시

1. `UserRole` 타입에 새 역할 추가 (`features/auth/types/index.ts`)
2. `ROLE_PERMISSIONS`에 해당 역할의 권한 매핑 추가
3. 끝! (컴포넌트 수정 불필요)

## 참고

- 전체 아키텍처: `/docs/admin-integration-architecture.md`
