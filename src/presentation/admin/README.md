# presentation/admin

어드민 전용 UI (완전 분리)

## 구조

```
admin/
├── pages/                  # 어드민 전용 페이지
│   └── AdminDashboardPage.tsx
│   └── ContentManagementPage.tsx
│   └── VideoManagementPage.tsx
│   └── UserManagementPage.tsx
│   └── AnalyticsPage.tsx
│
├── components/             # 어드민 전용 컴포넌트
│   └── AdminLayout/
│   └── AdminSidebar/
│   └── ContentTable/
│   └── VideoTable/
│   └── UserTable/
│   └── StatCard/
│
└── _hooks/                 # 어드민 페이지 전용 훅 (선택적)
    └── useAdminNavigation.ts
```

## 의존성 규칙

```typescript
// ✅ 허용: features/admin import
import { useAdminContentActions } from '@/features/admin/hooks';
import { adminContentApi } from '@/features/admin/api';
import type { AdminContentDto } from '@/features/admin/types';

// ✅ 허용: 다른 feature의 조회 API/DTO
import type { ContentDto } from '@/features/content/types';

// ✅ 허용: shared 컴포넌트
import { BasePage } from '@/presentation/components/page';

// ❌ 금지: 커스터머 페이지 import
import { ContentDetailPage } from '@/presentation/pages/content-detail';
```

## 페이지 작성 패턴

```typescript
// pages/ContentManagementPage.tsx

import { useAdminContentActions } from '@/features/admin/hooks';
import { AdminLayout } from '../components/AdminLayout';
import { ContentTable } from '../components/ContentTable';

export default function ContentManagementPage() {
  const { contents, handleEdit, handleDelete } = useAdminContentManagement();

  return (
    <AdminLayout title="콘텐츠 관리">
      <ContentTable
        data={contents}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </AdminLayout>
  );
}
```

## 스타일링

```typescript
// Emotion Native 사용 (프로젝트 컨벤션 준수)
import styled from '@emotion/native';
import colors from '@/shared/styles/colors';
import textStyles from '@/shared/styles/textStyles';

const AdminBadge = styled.View({
  backgroundColor: colors.primary,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 6,
});
```

## 분리 시나리오

나중에 어드민 앱을 별도로 분리할 경우:

1. 이 폴더(`presentation/admin/`)를 어드민 앱으로 이동
2. `features/admin/`은 공유 패키지로 추출
3. 네비게이션만 어드민 앱에 맞게 수정

## 참고

- 전체 아키텍처: `/docs/admin-integration-architecture.md`
- 비즈니스 로직: `/src/features/admin/README.md`
