# 고객 앱 어드민 기능 통합 아키텍처 가이드

> 고객 앱(Customer App)에 어드민 기능을 통합하기 위한 설계 가이드
>
> **원칙**: Toss Frontend Fundamentals (가독성, 예측가능성, 응집도, 결합도) + SOLID + React Native Best Practices

---

## 목차

1. [현재 상태](#1-현재-상태)
2. [핵심 설계 결정](#2-핵심-설계-결정)
3. [Permission 시스템](#3-permission-시스템)
4. [UI 패턴](#4-ui-패턴)
5. [폴더 구조](#5-폴더-구조)
6. [성능 최적화](#6-성능-최적화)
7. [스타일링 패턴](#7-스타일링-패턴)
8. [마이그레이션 가이드](#8-마이그레이션-가이드)

---

## 1. 현재 상태

### 1.1 DB 구조

```sql
-- profiles 테이블
role: user_role_enum ('user' | 'admin' | 'banned')
```

### 1.2 타입 정의

```typescript
// features/auth/types/index.ts
export type UserRole = 'user' | 'admin' | 'banned';

// AuthContextValue
role: UserRole;
isAdmin: boolean;
```

### 1.3 현재 사용 방식

```typescript
// ContentDetailPage.tsx
const { isAdmin } = useAuth();

<AnimatedAppBar
  onMorePress={isAdmin ? handleMorePress : undefined}
/>
```

**문제점:**
- 컴포넌트에 `isAdmin` 조건문 산재 가능성
- 역할 추가 시 모든 분기문 수정 필요 (OCP 위반)
- 권한 로직과 UI 로직 혼재 (SRP 위반)

---

## 2. 핵심 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| **역할 vs 권한** | Permission 기반 | 역할 추가 시 매핑만 수정 (OCP) |
| **조건부 렌더링** | `<AdminOnly>` 선언적 가드 | 가독성, 재사용성, 테스트 용이 |
| **상태 관리** | `useAuth()` 활용 | 이미 전역 Context 존재, 별도 AdminContext 불필요 |
| **번들 최적화** | Lazy Loading | 어드민 컴포넌트 일반 사용자 번들 제외 |
| **스타일링** | Emotion Native Props 분기 | 프로젝트 기존 패턴 유지 |

### 아키텍처 레이어

```
┌─────────────────────────────────────────────────────────────┐
│                    Permission Layer                          │
│  ┌───────────┐    ┌─────────────┐    ┌─────────────────┐    │
│  │   Roles   │ -> │ Permissions │ -> │ PermissionChecker│   │
│  │user/admin │    │ can_edit    │    │ hasPermission() │    │
│  └───────────┘    └─────────────┘    └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   UI Abstraction Layer                       │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │   AdminOnly     │    │   useAdminContentActions     │    │
│  │  (Declarative)  │    │   (Hook for action comp)     │    │
│  └─────────────────┘    └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│     ContentDetailPage, AnimatedAppBar, etc.                  │
│     (No direct role checks - uses abstractions)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Permission 시스템

### 3.1 Permission 타입 정의

```typescript
// features/auth/permissions/permissionTypes.ts

export type Permission =
  // 콘텐츠 관련
  | 'content:view'
  | 'content:edit'
  | 'content:delete'
  | 'content:manage'
  // 유저 관련
  | 'user:view_profile'
  | 'user:edit_own_profile'
  | 'user:manage_users'
  // 시스템 관련
  | 'system:view_analytics'
  | 'system:manage_settings';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  user: [
    'content:view',
    'user:view_profile',
    'user:edit_own_profile',
  ],
  admin: [
    'content:view',
    'content:edit',
    'content:delete',
    'content:manage',
    'user:view_profile',
    'user:edit_own_profile',
    'user:manage_users',
    'system:view_analytics',
    'system:manage_settings',
  ],
  banned: [],
  // 향후 확장
  // moderator: ['content:view', 'content:edit'],
  // premium: ['content:view', 'content:view_premium'],
} as const;
```

### 3.2 Permission Checker 유틸리티

```typescript
// features/auth/permissions/permissionChecker.ts

export const PermissionChecker = {
  hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  },

  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(role, p));
  },

  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(role, p));
  },
} as const;
```

### 3.3 usePermission 훅

```typescript
// shared/hooks/usePermission.ts

import { useMemo } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';
import { PermissionChecker } from '@/features/auth/permissions/permissionChecker';
import type { Permission } from '@/features/auth/permissions/permissionTypes';

interface UsePermissionReturn {
  can: (permission: Permission) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  role: UserRole;
  isAuthenticated: boolean;
}

export function usePermission(): UsePermissionReturn {
  const { role, status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const permissions = useMemo(() => ({
    can: (permission: Permission) =>
      isAuthenticated && PermissionChecker.hasPermission(role, permission),

    canAll: (perms: Permission[]) =>
      isAuthenticated && PermissionChecker.hasAllPermissions(role, perms),

    canAny: (perms: Permission[]) =>
      isAuthenticated && PermissionChecker.hasAnyPermission(role, perms),
  }), [role, isAuthenticated]);

  return { ...permissions, role, isAuthenticated };
}
```

---

## 4. UI 패턴

### 4.1 AdminOnly 선언적 가드 컴포넌트

```typescript
// features/auth/guards/AdminOnly.tsx

import { type ReactNode } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <>{fallback}</>;
  return <>{children}</>;
}
```

**사용 예시:**

```typescript
// Before: 조건부 렌더링 산재
{isAdmin && <MoreOptionsButton onPress={handleAdminAction} />}

// After: 선언적 가드
<AdminOnly>
  <MoreOptionsButton onPress={handleAdminAction} />
</AdminOnly>
```

### 4.2 PermissionGate 컴포넌트 (세분화된 권한)

```typescript
// shared/components/permission/PermissionGate.tsx

interface PermissionGateProps {
  permission: Permission | Permission[];
  mode?: 'all' | 'any';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  mode = 'all',
  children,
  fallback = null,
}: PermissionGateProps): ReactNode {
  const { can, canAll, canAny } = usePermission();

  const hasPermission = Array.isArray(permission)
    ? mode === 'all' ? canAll(permission) : canAny(permission)
    : can(permission);

  return hasPermission ? children : fallback;
}
```

**사용 예시:**

```typescript
// 단일 권한
<PermissionGate permission="content:edit">
  <EditButton />
</PermissionGate>

// 복수 권한 (OR)
<PermissionGate permission={['content:edit', 'content:manage']} mode="any">
  <ManagePanel />
</PermissionGate>
```

### 4.3 어드민 액션 훅

```typescript
// features/admin/hooks/useAdminContentActions.ts

import { useCallback, useState } from 'react';
import { useAuth } from '@/shared/providers/AuthProvider';

interface UseAdminContentActionsParams {
  contentId: number;
  contentType: ContentType;
}

interface UseAdminContentActionsReturn {
  isAdmin: boolean;
  handleMorePress: (() => void) | undefined;
  isAdminPanelVisible: boolean;
  handleCloseAdminPanel: () => void;
  sheets: ReactNode;
}

export function useAdminContentActions({
  contentId,
  contentType,
}: UseAdminContentActionsParams): UseAdminContentActionsReturn {
  const { isAdmin } = useAuth();
  const [isAdminPanelVisible, setAdminPanelVisible] = useState(false);

  const handleMorePress = useCallback(() => {
    setAdminPanelVisible(true);
  }, []);

  const handleCloseAdminPanel = useCallback(() => {
    setAdminPanelVisible(false);
  }, []);

  // 어드민이 아니면 빈 상태 반환 (일관된 인터페이스)
  if (!isAdmin) {
    return {
      isAdmin: false,
      handleMorePress: undefined,
      isAdminPanelVisible: false,
      handleCloseAdminPanel: () => {},
      sheets: null,
    };
  }

  return {
    isAdmin: true,
    handleMorePress,
    isAdminPanelVisible,
    handleCloseAdminPanel,
    sheets: (
      <AdminContentPanel
        visible={isAdminPanelVisible}
        contentId={contentId}
        contentType={contentType}
        onClose={handleCloseAdminPanel}
      />
    ),
  };
}
```

### 4.4 ContentDetailPage 리팩토링 예시

```typescript
// presentation/pages/content-detail/ContentDetailPage.tsx

import { useAdminContentActions } from '@/features/admin/hooks/useAdminContentActions';

export default function ContentDetailPage() {
  const { id, type, title, videoId } = route.params;

  // 일반 사용자 액션
  const favoriteAction = useFavoriteAction({ contentId, contentType });

  // 어드민 액션 (훅 내부에서 권한 체크)
  const adminContent = useAdminContentActions({ contentId, contentType });

  return (
    <ContentDetailProvider contentId={contentId} contentType={contentType} videoId={videoId}>
      <BasePage>
        <AnimatedAppBar
          insets={insets}
          opacity={appBarOpacity}
          title={title || undefined}
          // 어드민이면 어드민 핸들러, 아니면 일반 핸들러
          onMorePress={adminContent.handleMorePress ?? favoriteAction.handleMorePress}
        />
        {/* ... */}
      </BasePage>

      {/* 일반 사용자용 */}
      <FavoriteActionBottomSheet {...favoriteAction.sheetProps} />
      <LoginPromptDialog {...favoriteAction.dialogProps} />

      {/* 어드민용 (내부에서 조건부 렌더링) */}
      {adminContent.sheets}
    </ContentDetailProvider>
  );
}
```

---

## 5. 폴더 구조

### 5.1 핵심 원칙: 커스터머/어드민 분리

```
┌─────────────────────────────────────────────────────────────────┐
│                        분리 전략                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │   Customer      │         │     Admin       │                │
│  │   영역          │         │     영역        │                │
│  │                 │         │                 │                │
│  │ presentation/   │         │ presentation/   │                │
│  │   pages/        │         │   admin/        │   ← 완전 분리  │
│  │   components/   │         │     pages/      │                │
│  │                 │         │     components/ │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
│           │    ┌─────────────────┐    │                          │
│           └───►│ features/admin/ │◄───┘   ← 공유 로직            │
│                │   hooks/        │                               │
│                │   api/          │                               │
│                │   types/        │                               │
│                └─────────────────┘                               │
│                                                                  │
│  ※ 공존 케이스 (ContentDetailPage 등):                          │
│     features/admin 훅만 import → 의존성 쉽게 분리 가능           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 전체 폴더 구조

```
src/
├── features/
│   ├── auth/
│   │   ├── permissions/           # 권한 시스템
│   │   │   ├── permissionTypes.ts
│   │   │   └── permissionChecker.ts
│   │   ├── guards/
│   │   │   └── AdminOnly.tsx
│   │   └── types/
│   │       └── index.ts           # UserRole
│   │
│   └── admin/                     # 어드민 비즈니스 로직 (공유)
│       ├── api/
│       │   └── adminApi.ts
│       ├── hooks/
│       │   ├── useAdminContentActions.ts   # 콘텐츠 관리 액션
│       │   ├── useAdminVideoActions.ts     # 비디오 관리 액션
│       │   └── useAdminUserActions.ts      # 유저 관리 액션
│       ├── types/
│       │   └── index.ts
│       ├── constants/
│       │   └── roleStyles.ts
│       └── index.ts               # Public exports
│
├── presentation/
│   ├── admin/                     # 어드민 전용 UI (완전 분리)
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── ContentManagementPage.tsx
│   │   │   ├── UserManagementPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   ├── components/
│   │   │   ├── AdminLayout/
│   │   │   ├── AdminSidebar/
│   │   │   ├── ContentTable/
│   │   │   └── UserTable/
│   │   └── _hooks/                # 어드민 페이지 전용 훅
│   │       └── useAdminNavigation.ts
│   │
│   ├── pages/                     # 커스터머 페이지
│   │   ├── content-detail/        # 공존 케이스
│   │   │   ├── _components/
│   │   │   │   └── AnimatedAppBar.tsx
│   │   │   ├── _hooks/
│   │   │   │   └── useFavoriteAction.ts
│   │   │   └── ContentDetailPage.tsx
│   │   ├── home/
│   │   ├── explore/
│   │   └── ...
│   │
│   └── components/                # 공용 컴포넌트 (커스터머)
│       └── ...
│
└── shared/
    ├── providers/
    │   └── AuthProvider.tsx
    └── hooks/
        └── usePermission.ts
```

### 5.3 의존성 규칙

```typescript
// ✅ 허용: presentation/admin → features/admin
// presentation/admin/pages/ContentManagementPage.tsx
import { useAdminContentActions } from '@/features/admin/hooks/useAdminContentActions';
import { adminApi } from '@/features/admin/api/adminApi';

// ✅ 허용: presentation/pages (공존 케이스) → features/admin
// presentation/pages/content-detail/ContentDetailPage.tsx
import { useAdminContentActions } from '@/features/admin/hooks/useAdminContentActions';

// ❌ 금지: presentation/pages → presentation/admin
// 커스터머 페이지에서 어드민 컴포넌트 직접 import 금지
import { AdminTable } from '@/presentation/admin/components/AdminTable'; // ❌

// ❌ 금지: features/admin → presentation/admin
// 비즈니스 로직이 UI에 의존하면 안됨
import { AdminLayout } from '@/presentation/admin/components/AdminLayout'; // ❌
```

### 5.4 공존 케이스 패턴 (ContentDetailPage 등)

커스터머 페이지에서 어드민 기능이 필요한 경우, **features/admin 훅만 사용**합니다.

```typescript
// presentation/pages/content-detail/ContentDetailPage.tsx

// ✅ features/admin 훅만 import (의존성 최소화)
import { useAdminContentActions } from '@/features/admin/hooks/useAdminContentActions';

export default function ContentDetailPage() {
  // 커스터머 로직
  const favoriteAction = useFavoriteAction({ contentId, contentType });

  // 어드민 로직 (훅 내부에서 isAdmin 체크)
  // 나중에 어드민 분리 시 이 한 줄만 제거하면 됨
  const adminAction = useAdminContentActions({ contentId, contentType });

  return (
    <>
      <AnimatedAppBar
        onMorePress={adminAction.handleMorePress ?? favoriteAction.handleMorePress}
      />

      {/* 커스터머 UI */}
      <FavoriteActionBottomSheet {...favoriteAction.sheetProps} />

      {/* 어드민 UI - 훅에서 반환, 나중에 분리 시 이것만 제거 */}
      {adminAction.sheets}
    </>
  );
}
```

**분리 시 변경점:**
```typescript
// Before (공존)
const adminAction = useAdminContentActions({ contentId, contentType });

// After (분리) - 한 줄만 제거
// const adminAction = useAdminContentActions({ contentId, contentType });
const adminAction = { handleMorePress: undefined, sheets: null }; // 또는 훅 import 제거
```

---

## 6. 성능 최적화

### 6.1 Lazy Loading (번들 분리)

```typescript
// ContentDetailPage.tsx

import { lazy, Suspense } from 'react';

// 어드민 패널은 코드 스플리팅
const AdminContentPanel = lazy(
  () => import('@/features/admin/components/AdminContentPanel'),
);

// 렌더링
{isAdmin && isAdminPanelVisible && (
  <Suspense fallback={null}>
    <AdminContentPanel
      contentId={contentId}
      contentType={contentType}
      onClose={handleCloseAdminPanel}
    />
  </Suspense>
)}
```

**`isAdmin && isAdminPanelVisible` 이중 조건 이유:**
- `isAdmin`이 false면 `lazy` import 자체가 실행되지 않음
- 일반 사용자 번들에 어드민 코드 미포함
- 패널 최초 열릴 때만 청크 로드

### 6.2 메모이제이션 전략

```typescript
// AnimatedAppBar - 이미 React.memo 적용
const AnimatedAppBar = React.memo<AnimatedAppBarProps>(
  ({ insets, opacity, title, onMorePress }) => {
    // actions를 useMemo로 메모이제이션
    const actions = useMemo(
      () => (onMorePress ? [<MoreOptionsButton key="more" onPress={onMorePress} />] : []),
      [onMorePress],
    );
    // ...
  },
);
```

---

## 7. 스타일링 패턴

### 7.1 Props 기반 스타일 분기 (Emotion Native)

```typescript
// 어드민 배지가 있는 컨텐츠 카드
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';

interface ContentCardContainerProps {
  isAdmin: boolean;
}

const ContentCardContainer = styled.View<ContentCardContainerProps>(
  ({ isAdmin }) => ({
    backgroundColor: colors.gray06,
    borderRadius: 8,
    // 어드민 모드에서만 강조 테두리
    borderWidth: isAdmin ? 1 : 0,
    borderColor: isAdmin ? colors.primary : 'transparent',
  }),
);
```

### 7.2 Role 스타일 맵 (여러 Role 지원)

```typescript
// features/admin/constants/roleStyles.ts

import colors from '@/shared/styles/colors';
import type { UserRole } from '@/features/auth/types';

export const ROLE_BADGE_STYLES: Record<
  UserRole,
  { backgroundColor: string; label: string }
> = {
  admin: { backgroundColor: colors.primary, label: '관리자' },
  user: { backgroundColor: colors.gray04, label: '일반' },
  banned: { backgroundColor: colors.red, label: '차단됨' },
};
```

```typescript
// 사용
import { ROLE_BADGE_STYLES } from '@/features/admin/constants/roleStyles';

function UserRoleBadge() {
  const { role } = useAuth();
  const style = ROLE_BADGE_STYLES[role];

  return (
    <Badge backgroundColor={style.backgroundColor}>
      {style.label}
    </Badge>
  );
}
```

---

## 8. 마이그레이션 가이드

### Phase 1: 기반 구축

```
□ features/auth/permissions/ 생성
  ├── permissionTypes.ts
  └── permissionChecker.ts
□ features/auth/guards/AdminOnly.tsx 생성
□ shared/hooks/usePermission.ts 생성
```

### Phase 2: features/admin 구조 생성

```
□ features/admin/ 디렉토리 구조 생성
  ├── api/adminApi.ts
  ├── hooks/useAdminContentActions.ts
  ├── types/index.ts
  └── index.ts
```

### Phase 3: presentation/admin 구조 생성 (어드민 전용 UI)

```
□ presentation/admin/ 디렉토리 생성
  ├── pages/
  │   └── AdminDashboardPage.tsx
  └── components/
      └── AdminLayout/
```

### Phase 4: 공존 케이스 리팩토링

```
□ ContentDetailPage에 useAdminContentActions 훅 적용
□ 다른 공존 페이지들 점진적 적용
□ 의존성 규칙 검증 (커스터머 → features/admin만 허용)
```

### Phase 5: 향후 분리 준비

```
□ 어드민 앱 별도 분리 시:
  ├── features/admin/ → 공유 패키지로 추출 가능
  ├── presentation/admin/ → 어드민 앱으로 이동
  └── 공존 케이스 → 훅 import만 제거하면 완료
```

---

## 핵심 원칙 요약

### 분리 전략

| 케이스 | 위치 | 예시 |
|--------|------|------|
| **어드민 전용 UI** | `presentation/admin/` | AdminDashboard, UserManagement |
| **어드민 비즈니스 로직** | `features/admin/` | hooks, api, types (공유) |
| **커스터머 UI** | `presentation/pages/` | Home, Explore, Profile |
| **공존 케이스** | 커스터머 + features/admin 훅 | ContentDetailPage |

### 의존성 규칙

```
presentation/admin/     →  features/admin/     ✅
presentation/pages/     →  features/admin/     ✅ (공존 케이스)
presentation/pages/     →  presentation/admin/ ❌ (금지)
features/admin/         →  presentation/       ❌ (금지)
```

### 공존 케이스 설계 원칙

```typescript
// 1. features/admin 훅만 import (의존성 최소화)
import { useAdminContentActions } from '@/features/admin';

// 2. 훅이 null/undefined 반환하면 어드민 UI 미렌더링
const adminAction = useAdminContentActions({ contentId });

// 3. 분리 시 한 줄만 제거하면 됨
// const adminAction = useAdminContentActions({ contentId }); ← 이것만 제거
```

### 원칙별 개선

| 원칙 | Before | After |
|------|--------|-------|
| **가독성** | `isAdmin ? ... : ...` 산재 | `<AdminOnly>` 선언적 표현 |
| **예측가능성** | 컴포넌트마다 다른 권한 체크 | 일관된 훅/가드 패턴 |
| **응집도** | 어드민 로직 여러 파일 흩어짐 | `features/admin/` + `presentation/admin/` |
| **결합도** | 커스터머↔어드민 강결합 | 훅 기반 약결합, 쉬운 분리 |

---

## 참고

- **Toss Frontend Fundamentals**: https://frontend-fundamentals.com
- **SLASH 21 Clean Code**: 진유림 - "실무에서 바로 쓰는 Frontend Clean Code"
- **프로젝트 스타일 가이드**: `/CLAUDE.md`
