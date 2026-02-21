# features/auth/guards

선언적 권한 가드 컴포넌트

## 구조

```
guards/
├── AdminOnly.tsx           # 어드민 전용 렌더링 가드
├── PermissionGate.tsx      # 세분화된 권한 가드 (선택적)
└── index.ts                # Public exports
```

## AdminOnly

가장 간단한 어드민 전용 가드

```typescript
// AdminOnly.tsx
interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
```

### 사용 예시

```typescript
// Before
{isAdmin && <EditButton />}

// After
<AdminOnly>
  <EditButton />
</AdminOnly>

// fallback 사용
<AdminOnly fallback={<GuestMessage />}>
  <AdminDashboard />
</AdminOnly>
```

## PermissionGate (선택적)

세분화된 권한 체크가 필요할 때

```typescript
// PermissionGate.tsx
interface PermissionGateProps {
  permission: Permission | Permission[];
  mode?: 'all' | 'any';
  children: ReactNode;
  fallback?: ReactNode;
}
```

### 사용 예시

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

## 언제 사용하나?

| 상황 | 권장 패턴 |
|------|----------|
| 단순 어드민 체크 | `<AdminOnly>` |
| 세분화된 권한 | `<PermissionGate>` |
| 복잡한 로직 (API 호출 등) | `features/admin` 훅 사용 |

## 참고

- 전체 아키텍처: `/docs/admin-integration-architecture.md`
