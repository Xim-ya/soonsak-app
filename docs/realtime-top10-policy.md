# 실시간 Top 10 랭킹 정책

## 개요

실시간 Top 10은 **결말 포함 영상이 있는 콘텐츠**를 대상으로, 글로벌 트렌드와 순삭 자체 인기도를 결합하여 현재 가장 주목받는 콘텐츠를 노출합니다.

---

## 필수 조건

> **모든 Top 10 콘텐츠는 `includes_ending = true`인 영상이 1개 이상 있어야 합니다.**

---

## 우선순위 구조

| 순위 | 데이터 소스 | 기준 |
|------|------------|------|
| **1~N위** | TMDB Trending | 글로벌 주간 인기도 |
| **N+1~10위** | Supabase | 순삭 자체 인기도 (점수 기반) |

---

## 10개 선정 규칙

### 예시 시나리오

**Case 1: TMDB 트렌딩에서 3개 매칭**
```
TMDB 트렌딩 20개 중 조건 충족 콘텐츠: 3개
→ 1~3위: TMDB 트렌딩 콘텐츠 (source: 'tmdb')
→ 4~10위: 순삭 인기도 기반 콘텐츠 7개 (source: 'engagement')
```

**Case 2: TMDB 트렌딩에서 10개 이상 매칭**
```
TMDB 트렌딩 20개 중 조건 충족 콘텐츠: 12개
→ 1~10위: TMDB 트렌딩 콘텐츠 상위 10개만 (source: 'tmdb')
→ 인기도 기반 콘텐츠 조회 안함
```

**Case 3: TMDB 트렌딩에서 0개 매칭**
```
TMDB 트렌딩 20개 중 조건 충족 콘텐츠: 0개
→ 1~10위: 순삭 인기도 기반 콘텐츠 10개 (source: 'engagement')
```

### 중복 제거 규칙

- 동일 콘텐츠는 `id + contentType` 조합으로 식별
- TMDB 트렌딩에서 이미 선정된 콘텐츠는 인기도 기반 목록에서 제외

---

## 세부 정책

### TMDB 트렌딩 (1~N위)

| 항목 | 내용 |
|------|------|
| **API** | `/trending/all/week` (주간 트렌딩) |
| **필터 조건** | 순삭 등록 + `includes_ending = true` |
| **정렬** | TMDB 트렌딩 API 응답 순서 유지 |
| **이미지** | `backdropPath` 우선, `posterPath` 폴백 |

### 인기도 기반 (N+1~10위)

| 항목 | 내용 |
|------|------|
| **데이터 소스** | Supabase `contents` + `videos` JOIN |
| **필터 조건** | `includes_ending = true` |
| **점수 공식** | `score = (play_count × 2) + (view_count × 1)` |
| **정렬** | score DESC, uploaded_at DESC |
| **이미지** | `backdropPath` 우선, `posterPath` 폴백 |

#### 점수 가중치

| 요소 | 가중치 | 비율 | 설명 |
|------|--------|------|------|
| play_count | ×2 | 66.7% | 영상 재생 (강한 관심 신호) |
| view_count | ×1 | 33.3% | 상세 페이지 진입 (중간 관심 신호) |

---

## 데이터 조회 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. TMDB 주간 트렌딩 조회                                          │
│    GET /trending/all/week → 20개 콘텐츠                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 순삭 DB 필터링 (RPC: get_registered_contents_with_ending)     │
│    - contents 테이블에 등록된 콘텐츠                              │
│    - includes_ending = true인 영상 존재                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 순위 할당 (1~N위)                                             │
│    TMDB 트렌딩 순서 유지                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    10개 미만인 경우
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. 인기도 기반 보완 (RPC: get_top_contents_by_score)             │
│    - includes_ending = true 필터                                │
│    - score = play_count × 2 + view_count × 1                    │
│    - TMDB 중복 제외                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 이미지 표시 정책

```typescript
const imageUrl = item.backdropPath
  ? prefixTmdbImgUrl(item.backdropPath, { size: 'w780' })
  : prefixTmdbImgUrl(item.posterPath, { size: 'w500' });
```

| 우선순위 | 이미지 | 사이즈 | 비율 |
|---------|--------|-------|------|
| 1순위 | backdropPath | w780 | 16:9 (가로형) |
| 2순위 | posterPath | w500 | 2:3 (세로형) |

---

## 캐싱 정책

| 항목 | 값 |
|------|-----|
| staleTime | 5분 |
| 갱신 조건 | 화면 재진입 시 (staleTime 경과 후) |

---

## Supabase RPC 함수

### get_registered_contents_with_ending

TMDB ID로 등록된 콘텐츠 조회 (includes_ending 필터 적용)

```sql
SELECT DISTINCT ON (c.id) c.*
FROM contents c
INNER JOIN videos v ON c.id = v.content_id AND c.content_type = v.content_type
WHERE c.id = ANY(p_ids)
  AND c.content_type = p_content_type
  AND v.includes_ending = true
```

### get_top_contents_by_score

점수 기반 인기 콘텐츠 조회 (includes_ending 필터 적용)

```sql
SELECT c.*, (play_count * 2 + view_count * 1) AS score
FROM contents c
INNER JOIN videos v ON c.id = v.content_id AND c.content_type = v.content_type
WHERE v.includes_ending = true
ORDER BY score DESC
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/presentation/pages/home/_types/topTenContentModel.home.ts` | Top 10 콘텐츠 모델 정의 |
| `src/presentation/pages/home/_hooks/useWeeklyTopTen.ts` | 주간 Top 10 데이터 조회 훅 |
| `src/presentation/pages/home/_components/TopTenContentListView.tsx` | Top 10 UI 컴포넌트 |
| `src/features/tmdb/api/tmdbApi.ts` | TMDB Trending API |
| `src/features/content/api/contentApi.ts` | Supabase 콘텐츠 API |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-01-28 | 최초 작성 |
| 1.1 | 2025-01-28 | includes_ending 필터 추가, 점수 가중치 (play:view = 2:1) 적용 |
