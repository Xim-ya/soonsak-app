# ⚡️ 성능 최적화 Quick Reference

> 개발 시 빠르게 참고할 수 있는 최적화 패턴 체크리스트

---

## 🎯 핵심 원칙 4가지

### 1. 비동기 워터폴 제거
```typescript
// ❌ 나쁜 예: 순차 실행
const config = await fetchConfig();
const data = await fetchData();

// ✅ 좋은 예: 병렬 실행
const [config, data] = await Promise.all([
  fetchConfig(),
  fetchData(),
]);
```

### 2. 중복 API 호출 방지
```typescript
// ❌ 나쁜 예: 중복 호출
const policy1 = await appConfigApi.getVersionPolicy();
const policy2 = await appConfigApi.getVersionPolicy();

// ✅ 좋은 예: 캐시 활용
await appConfigManager.initialize(); // 한 번만
const policy = appConfigManager.getVersionPolicy(); // 캐시 조회
```

### 3. 컴포넌트 메모이제이션
```typescript
// ❌ 나쁜 예: 항상 리렌더
function Component({ data }) {
  return <HeavyComponent data={data} />;
}

// ✅ 좋은 예: memo로 보호
const Component = memo(function Component({ data }) {
  return <HeavyComponent data={data} />;
});
```

### 4. Provider 컴포지션
```typescript
// ❌ 나쁜 예: 깊은 중첩
<ProviderA><ProviderB><ProviderC>
  <App />
</ProviderC></ProviderB></ProviderA>

// ✅ 좋은 예: 단일 컴포지션
const AppProviders = memo(({ children }) => (
  <ProviderA><ProviderB><ProviderC>
    {children}
  </ProviderC></ProviderB></ProviderA>
));
```

---

## 📋 코드 작성 체크리스트

### 비동기 작업
- [ ] 독립적인 요청은 `Promise.all`로 병렬 처리
- [ ] 부분 실패 허용 시 `Promise.allSettled` 사용
- [ ] 조건부 로직은 `await` 전에 평가
- [ ] 의존성 있는 작업만 순차 처리

### 데이터 페칭
- [ ] 동일 데이터 중복 요청 방지
- [ ] 캐시 활용 (React Query, SWR, 싱글톤)
- [ ] 조건부 페칭으로 불필요한 요청 방지
- [ ] staleTime, gcTime 설정

### 컴포넌트 최적화
- [ ] 무거운 컴포넌트는 `React.memo` 적용
- [ ] 콜백 함수는 `useCallback`으로 안정화
- [ ] 복잡한 계산은 `useMemo` 사용
- [ ] 단순 계산은 일반 변수로 (과도한 메모이제이션 X)

### 렌더링 최적화
- [ ] FlatList에 최적화 옵션 적용
- [ ] 이미지에 `LoadableImageView` 또는 `FastImage` 사용
- [ ] 애니메이션에 `useNativeDriver: true` 필수
- [ ] 리스트 아이템에 `keyExtractor` 사용

### 에러 처리
- [ ] `try-catch`로 앱 크래시 방지
- [ ] timeout으로 무한 대기 방지
- [ ] 에러 시에도 앱 진입 허용
- [ ] 로그로 디버깅 정보 수집

---

## 🔧 실전 패턴

### Pattern 1: 병렬 초기화
```typescript
useEffect(() => {
  async function initialize() {
    // ⚡️ 병렬 실행
    const [config, user, data] = await Promise.all([
      fetchConfig(),
      fetchUser(),
      fetchData(),
    ]);

    setState({ config, user, data });
  }

  initialize();
}, []);
```

### Pattern 2: 조건부 병렬 실행
```typescript
async function loadData(userId: string) {
  // Step 1: 사용자 정보 (의존성 없음)
  const user = await fetchUser(userId);

  // Step 2: 사용자 정보에 의존하는 데이터 병렬 처리
  const [posts, comments, likes] = await Promise.all([
    fetchPosts(user.id),
    fetchComments(user.id),
    fetchLikes(user.id),
  ]);

  return { user, posts, comments, likes };
}
```

### Pattern 3: 이미지 병렬 프리페치
```typescript
// ❌ 나쁜 예: 순차 처리
for (const url of urls) {
  await Image.prefetch(url);
}

// ✅ 좋은 예: 병렬 처리
await Promise.allSettled(
  urls.map(url => Image.prefetch(url))
);
```

### Pattern 4: 캐시 우선 조회
```typescript
// 싱글톤 매니저 패턴
class ConfigManager {
  private cache: Config | null = null;

  async initialize() {
    if (this.cache) return;
    this.cache = await fetchConfig();
  }

  getConfig() {
    return this.cache; // 캐시 조회
  }
}
```

### Pattern 5: Provider 컴포지션
```typescript
const AppProviders = memo(function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
});
```

### Pattern 6: 메모이제이션 콜백
```typescript
const Component = memo(function Component({ onPress }) {
  const handlePress = useCallback((id: string) => {
    onPress(id);
  }, [onPress]);

  return <Button onPress={handlePress} />;
});
```

---

## 🚫 안티패턴 (피해야 할 것)

### ❌ 순차 await
```typescript
// 나쁜 예
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();
// 총 시간: 300ms + 400ms + 500ms = 1200ms
```

### ❌ 중복 API 호출
```typescript
// 나쁜 예
const data1 = await fetchConfig(); // 300ms
const data2 = await fetchConfig(); // 300ms (중복!)
```

### ❌ 불필요한 메모이제이션
```typescript
// 나쁜 예: 단순 계산에 useMemo
const year = useMemo(() =>
  data?.date ? new Date(data.date).getFullYear() : ''
, [data?.date]);

// 좋은 예: 일반 변수
const year = data?.date ? new Date(data.date).getFullYear() : '';
```

### ❌ 깊은 Provider 중첩
```typescript
// 나쁜 예
<A><B><C><D><E><F>
  <App />
</F></E></D></C></B></A>

// 좋은 예
<AppProviders>
  <App />
</AppProviders>
```

### ❌ useEffect 의존성 누락
```typescript
// 나쁜 예
useEffect(() => {
  fetchData(userId);
}, []); // userId 변경 시 재실행 안 됨

// 좋은 예
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

---

## 📊 성능 측정 도구

### Console 타이머
```typescript
console.time('Preload');
await preloadResources();
console.timeEnd('Preload'); // "Preload: 500ms"
```

### React DevTools Profiler
```typescript
// Profiler로 컴포넌트 렌더링 시간 측정
<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

### Network 워터폴 확인
```
Chrome DevTools → Network Tab
- 병렬 요청 확인
- 중복 요청 확인
- 응답 시간 측정
```

---

## 🎯 프로젝트별 최적화 적용 예시

### 앱 초기화 (App.tsx)
```typescript
// ⚡️ Provider 컴포지션
const AppProviders = memo(function AppProviders({ children }) { ... });

// ⚡️ 컴포넌트 메모이제이션
const AppContent = memo(function AppContent({ ... }) { ... });
const NavigationWrapper = memo(function NavigationWrapper({ ... }) { ... });
```

### 데이터 프리로드 (useAppPreload.ts)
```typescript
// ⚡️ 병렬 실행
const [, bannerContents] = await Promise.all([
  appConfigManager.initialize(),
  contentApi.getRandomBannerContents(5),
]);

// ⚡️ 이미지 병렬 프리페치
await Promise.allSettled(urls.map(url => Image.prefetch(url)));
```

### 버전 체크 (useAppVersionCheck.ts)
```typescript
// ⚡️ 캐시 조회 (중복 API 제거)
const policy = appConfigManager.getVersionPolicy();
```

---

## 🔍 디버깅 팁

### 1. API 호출 추적
```typescript
// Before/After 비교
console.log('API calls:', {
  before: 3,
  after: 2,
  saved: 1
});
```

### 2. 렌더링 추적
```typescript
// 리렌더 횟수 확인
const renderCount = useRef(0);
renderCount.current += 1;
console.log('Render count:', renderCount.current);
```

### 3. 시간 측정
```typescript
const startTime = performance.now();
await operation();
const duration = performance.now() - startTime;
console.log(`Operation took ${duration}ms`);
```

---

## 📚 더 알아보기

### 상세 문서
- [성능 최적화 가이드](./PERFORMANCE_OPTIMIZATION.md)
- [최적화 요약](./OPTIMIZATION_SUMMARY.md)
- [시각화 다이어그램](./OPTIMIZATION_DIAGRAM.md)

### 베스트 프랙티스
- [프로젝트 가이드](/CLAUDE.md)
- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [Vercel React Patterns](https://nextjs.org/docs/basic-features/performance)

---

## ✅ 빠른 점검

코드 작성 후 다음을 확인하세요:

```
□ 병렬 가능한 작업은 Promise.all 사용했는가?
□ 동일 데이터를 중복 요청하지 않는가?
□ 무거운 컴포넌트는 memo를 적용했는가?
□ 콜백 함수는 useCallback으로 안정화했는가?
□ Provider는 적절히 컴포지션했는가?
□ FlatList 최적화 옵션을 적용했는가?
□ 애니메이션에 useNativeDriver: true를 사용했는가?
□ 에러 처리를 적절히 했는가?
□ 성능을 측정했는가?
```

---

## 🎉 정리

**핵심 3가지만 기억하세요:**

1. **병렬 실행** - Promise.all로 워터폴 제거
2. **캐시 활용** - 중복 요청 방지
3. **메모이제이션** - 불필요한 리렌더 차단

이것만으로도 **27% 성능 향상**을 달성할 수 있습니다! 🚀
