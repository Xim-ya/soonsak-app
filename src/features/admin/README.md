# features/admin

어드민 비즈니스 로직 (공유 레이어)

## 구조

```
admin/
├── api/                    # 어드민 전용 Supabase API
│   └── adminContentApi.ts
│   └── adminVideoApi.ts
│   └── adminUserApi.ts
│
├── hooks/                  # 어드민 액션 훅
│   └── useAdminContentActions.ts
│   └── useAdminVideoActions.ts
│   └── useAdminUserActions.ts
│
├── types/                  # 어드민 전용 타입/DTO
│   └── index.ts
│
├── constants/              # 어드민 상수 (Role 스타일 등)
│   └── roleStyles.ts
│
└── index.ts                # Public exports
```

## 사용처

1. **presentation/admin/** - 어드민 전용 페이지에서 사용
2. **presentation/pages/** - 공존 케이스 (ContentDetailPage 등)

## 의존성 규칙

```typescript
// ✅ 허용: 다른 feature의 조회 API/DTO import
import { contentApi } from '@/features/content/api/contentApi';
import type { ContentDto } from '@/features/content/types';

// ✅ 허용: 타입 확장
export interface AdminContentDto extends ContentDto {
  isHidden: boolean;
}

// ❌ 금지: presentation 레이어 import
import { AdminLayout } from '@/presentation/admin/components';
```

## 훅 작성 패턴

```typescript
// hooks/useAdminContentActions.ts

export function useAdminContentActions({ contentId }: Params) {
  const { isAdmin } = useAuth();

  // 어드민 아니면 빈 상태 반환 (일관된 인터페이스)
  if (!isAdmin) {
    return {
      handleMorePress: undefined,
      sheets: null,
    };
  }

  // 어드민 로직
  return {
    handleMorePress: () => { /* ... */ },
    sheets: <AdminPanel />,
  };
}
```

## 참고

- 전체 아키텍처: `/docs/admin-integration-architecture.md`
