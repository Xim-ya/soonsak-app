# Channel Detail Page

채널 상세 페이지 구현 - YouTube 채널의 비디오 목록을 3열 그리드로 표시합니다.

## 파일 구조

```
channel-detail/
├── ChannelDetailPage.tsx     # 메인 페이지 컴포넌트
├── _hooks/
│   └── useChannelVideos.ts   # 채널 비디오 조회 Hook (useInfiniteQuery)
├── _components/
│   └── VideoGridItem.tsx     # 그리드 아이템 컴포넌트
├── index.ts                  # Export 파일
└── README.md                 # 문서
```

## 주요 기능

### 1. 채널 정보 헤더
- 90px 원형 채널 로고 (RoundedAvatorView)
- 채널 이름 (headline1 스타일)
- 구독자 수 (1만 이상은 "N.N만" 형식)
- 콘텐츠 개수

### 2. 비디오 그리드
- 3열 고정 그리드 레이아웃
- 각 아이템: 포스터 이미지 + 콘텐츠 타입 칩 + 제목
- 무한 스크롤 페이지네이션 (useInfiniteQuery)
- 아이템 클릭 시 콘텐츠 상세 페이지로 이동

### 3. UI/UX
- 상단/하단 그라데이션 오버레이 (스크롤 시 상단 그라데이션 페이드인)
- BackButtonAppBar (뒤로가기 버튼)
- FlatList 최적화 적용

## 사용된 컴포넌트

### 공통 컴포넌트
- `BasePage`: 기본 페이지 컨테이너
- `BackButtonAppBar`: 뒤로가기 앱바
- `RoundedAvatorView`: 원형 아바타 이미지
- `LoadableImageView`: 로딩/에러 처리가 포함된 이미지
- `ContentTypeChip`: 콘텐츠 타입 칩
- `DarkedLinearShadow`: 검정 그라데이션 그림자
- `Gap`: 간격 컴포넌트

### 스타일 시스템
- `colors`: 색상 시스템 (gray01, gray03 등)
- `textStyles`: 텍스트 스타일 시스템 (headline1, alert2, desc 등)
- `AppSize`: 반응형 크기 유틸리티

## API 연동

### useChannelVideos Hook
- `@tanstack/react-query`의 `useInfiniteQuery` 사용
- 페이지당 20개 아이템
- 5분 stale time
- 자동 페이지네이션

```typescript
const { videos, isLoading, fetchNextPage, hasNextPage, totalCount } =
  useChannelVideos(channelId);
```

## React Native Best Practices 준수 사항

### 1. 스타일링
✅ StyleSheet 대신 Emotion Native 사용
✅ 직접 색상/폰트 값 금지, colors/textStyles 사용
✅ AppSize.screenWidth로 반응형 크기 처리

### 2. 성능 최적화
✅ FlatList 최적화 옵션 적용
- removeClippedSubviews: true
- maxToRenderPerBatch: 10
- windowSize: 10
- initialNumToRender: 10
✅ renderItem, keyExtractor 메모이제이션
✅ useCallback으로 핸들러 최적화
✅ useSharedValue + withTiming으로 애니메이션 (Reanimated)

### 3. 데이터 페칭
✅ useInfiniteQuery로 무한 스크롤 구현
✅ 적절한 staleTime 설정 (5분)
✅ onEndReached로 다음 페이지 로드

### 4. 코드 품질
✅ 복잡한 조건 변수로 추출 (shouldUpdate)
✅ 매직 넘버 상수화 (ITEM_WIDTH, POSTER_HEIGHT)
✅ Props 타입 명시 (ScreenRouteProp)

## 레이아웃 계산

```typescript
// 3열 그리드 계산
const ITEM_WIDTH = (AppSize.screenWidth - 32 - 18) / 3;
// screenWidth - 좌우 패딩(32) - 갭(9 * 2) / 3열

// 포스터 비율 유지 (165:109)
const POSTER_HEIGHT = ITEM_WIDTH * (165 / 109);
```

## 네비게이션 파라미터

```typescript
route.params = {
  channelId: string;        // YouTube 채널 ID
  channelName: string;      // 채널 이름
  channelLogoUrl: string;   // 채널 로고 URL
  subscriberCount: number;  // 구독자 수
}
```

## 사용 예시

```typescript
navigation.navigate(routePages.channelDetail, {
  channelId: 'UCxxxxx',
  channelName: '채널 이름',
  channelLogoUrl: 'https://...',
  subscriberCount: 125000,
});
```

## 개선 가능 사항

1. 로딩 상태 UI (현재는 빈 화면)
2. 에러 상태 UI
3. 비디오 없을 때 EmptyView
4. 구독 버튼 추가
5. 채널 소개 섹션
6. 탭 네비게이션 (비디오/재생목록/정보)
