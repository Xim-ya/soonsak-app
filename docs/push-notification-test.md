# Push Notification 테스트 가이드

> 실제 데이터 기반 딥링크 테스트 케이스

## 환경 정보

| 항목 | 값 |
|------|-----|
| **Project URL** | `https://hhgnrkejmkprfypwjhmz.supabase.co` |
| **Edge Function** | `send-push` |
| **Scheme** | `soonsak://` |

---

## 1. 기본 설정

### 공통 헤더

```bash
# 환경 변수로 설정 (선택)
export SUPABASE_URL="https://hhgnrkejmkprfypwjhmz.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc"
export TEST_USER_ID="b5ec5a91-e64a-41ac-a9cb-046ab1695d29"
```

### 테스트 사용자

| user_id | email | 플랫폼 |
|---------|-------|--------|
| `b5ec5a91-e64a-41ac-a9cb-046ab1695d29` | vkdl370528@naver.com | iOS, Android |

---

## 2. NAVIGATION 테스트

### 2.1 ContentDetail (콘텐츠 상세)

**영화 상세 페이지로 이동:**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "새 콘텐츠 추천",
    "body": "악마는 프라다를 입는다를 시청해보세요!",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "ContentDetail",
        "params": {
          "id": 350,
          "title": "악마는 프라다를 입는다",
          "type": "movie"
        }
      }
    }
  }'
```

**TV 시리즈 상세 페이지로 이동:**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "시리즈 추천",
    "body": "어느 날 월터 형제들과 살게 됐다",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "ContentDetail",
        "params": {
          "id": 199001,
          "title": "어느 날 월터 형제들과 살게 됐다",
          "type": "tv"
        }
      }
    }
  }'
```

### 2.2 Player (플레이어 - 이어보기)

**영상 바로 재생 (이어보기):**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "이어보기",
    "body": "어제 보던 사랑의 블랙홀 계속 보시겠어요?",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "Player",
        "params": {
          "videoId": "FS9l9HT-_Qc",
          "title": "평점 9.2점 당신의 인생을 바꿀 최고의 걸작",
          "contentId": 137,
          "contentType": "movie",
          "startSeconds": 300
        }
      }
    }
  }'
```

**처음부터 재생 (startSeconds 없음):**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "영상 추천",
    "body": "조 블랙의 사랑 어떠세요?",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "Player",
        "params": {
          "videoId": "IBAWkmKucb4",
          "title": "네이버 평점 9점대를 유지한 전세계가 인정한 명작",
          "contentId": 297,
          "contentType": "movie"
        }
      }
    }
  }'
```

### 2.3 ChannelDetail (채널 상세)

**채널 페이지로 이동:**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "채널 알림",
    "body": "영화맛집에서 새 영상이 업로드되었습니다!",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "ChannelDetail",
        "params": {
          "channelId": "UCguwAEyC1STmy5vqgvNsX9A",
          "channelName": "영화맛집"
        }
      }
    }
  }'
```

### 2.4 Search (검색)

**검색 화면으로 이동:**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "검색해보세요",
    "body": "오늘의 추천 키워드: 느와르",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "Search",
        "params": {}
      }
    }
  }'
```

### 2.5 Settings (설정)

**설정 화면으로 이동:**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "설정 확인",
    "body": "알림 설정을 확인해주세요",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "Settings",
        "params": {}
      }
    }
  }'
```

### 2.6 UserContentList (내 콘텐츠 목록) - 인증 필요

**찜 목록으로 이동 (initialTab: 0):**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "찜 목록",
    "body": "찜한 콘텐츠를 확인해보세요",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "UserContentList",
        "params": {
          "initialTab": 0
        }
      }
    }
  }'
```

**시청 기록으로 이동 (initialTab: 2):**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "시청 기록",
    "body": "최근 본 영상을 확인해보세요",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "UserContentList",
        "params": {
          "initialTab": 2
        }
      }
    }
  }'
```

---

## 3. ACTION 테스트

### 3.1 REQUEST_REVIEW (앱스토어 리뷰 요청)

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "순삭은 어떠셨나요?",
    "body": "별점을 남겨주세요!",
    "data": {
      "version": "1.0",
      "action": {
        "type": "ACTION",
        "action": "REQUEST_REVIEW"
      }
    }
  }'
```

### 3.2 OPEN_URL (외부 URL 열기)

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "공지사항",
    "body": "새로운 기능이 추가되었습니다",
    "data": {
      "version": "1.0",
      "action": {
        "type": "ACTION",
        "action": "OPEN_URL",
        "payload": {
          "url": "https://example.com/notice"
        }
      }
    }
  }'
```

### 3.3 OPEN_SETTINGS (설정 열기)

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "설정 확인",
    "body": "알림 설정을 확인해주세요",
    "data": {
      "version": "1.0",
      "action": {
        "type": "ACTION",
        "action": "OPEN_SETTINGS"
      }
    }
  }'
```

### 3.4 REFRESH_DATA (데이터 새로고침)

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "콘텐츠 업데이트",
    "body": "새로운 콘텐츠가 추가되었습니다",
    "data": {
      "version": "1.0",
      "action": {
        "type": "ACTION",
        "action": "REFRESH_DATA",
        "payload": {
          "target": "home"
        }
      }
    }
  }'
```

---

## 4. 단순 푸시 테스트 (딥링크 없음)

**data 없이 기본 알림만:**

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "안녕하세요!",
    "body": "순삭에서 알려드립니다."
  }'
```

---

## 5. 에러 케이스 테스트

### 5.1 존재하지 않는 사용자

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000000",
    "title": "Test",
    "body": "Hello"
  }'
```

**예상 응답:**
```json
{"success":false,"message":"No active push tokens found."}
```

### 5.2 필수 필드 누락

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test"
  }'
```

**예상 응답:**
```json
{"error":"user_id, title, body are required."}
```

### 5.3 잘못된 화면 이름

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "b5ec5a91-e64a-41ac-a9cb-046ab1695d29",
    "title": "Test",
    "body": "Invalid screen test",
    "data": {
      "version": "1.0",
      "action": {
        "type": "NAVIGATION",
        "screen": "InvalidScreen",
        "params": {}
      }
    }
  }'
```

**예상 동작:** 앱에서 graceful degradation 처리 (홈으로 이동 또는 무시)

---

## 6. 응답 예시

### 성공

```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "tickets": [
    {
      "status": "ok",
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

### 토큰 없음

```json
{
  "success": false,
  "message": "No active push tokens found."
}
```

---

## 7. 테스트 체크리스트

### 앱 상태별 테스트

| 앱 상태 | 테스트 항목 | 확인 |
|---------|------------|------|
| **Foreground** | 알림 배너 표시 → 탭 → 네비게이션 | ☐ |
| **Background** | 시스템 알림 → 탭 → 네비게이션 | ☐ |
| **Killed** | 시스템 알림 → 탭 → 앱 시작 + 네비게이션 | ☐ |

### 인증 테스트

| 케이스 | 예상 동작 | 확인 |
|--------|----------|------|
| 로그인 상태 + UserContentList | 내 콘텐츠 목록으로 이동 | ☐ |
| 비로그인 + UserContentList | 로그인 → 로그인 성공 → 내 콘텐츠 목록 | ☐ |

### 에러 처리 테스트

| 케이스 | 예상 동작 | 확인 |
|--------|----------|------|
| 잘못된 screen | 앱 크래시 없음, graceful 처리 | ☐ |
| params 누락 | 앱 크래시 없음, graceful 처리 | ☐ |
| 잘못된 action type | 앱 크래시 없음, 무시 | ☐ |

---

## 8. DB 확인 쿼리

### 토큰 등록 확인

```sql
SELECT user_id, token, platform, is_active, updated_at
FROM push_tokens
WHERE is_active = true;
```

### 특정 사용자 토큰 확인

```sql
SELECT * FROM push_tokens
WHERE user_id = 'b5ec5a91-e64a-41ac-a9cb-046ab1695d29';
```

---

## 9. 한 줄 복사용 curl 명령어

> 터미널에서 복사/붙여넣기 시 줄바꿈 문제가 발생할 경우 아래 한 줄 명령어를 사용하세요.

### ContentDetail (영화 상세)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"새 콘텐츠 추천","body":"악마는 프라다를 입는다를 시청해보세요!","data":{"version":"1.0","action":{"type":"NAVIGATION","screen":"ContentDetail","params":{"id":350,"title":"악마는 프라다를 입는다","type":"movie"}}}}'
```

### Player (이어보기)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"이어보기","body":"어제 보던 사랑의 블랙홀 계속 보시겠어요?","data":{"version":"1.0","action":{"type":"NAVIGATION","screen":"Player","params":{"videoId":"FS9l9HT-_Qc","title":"평점 9.2점 당신의 인생을 바꿀 최고의 걸작","contentId":137,"contentType":"movie","startSeconds":300}}}}'
```

### ChannelDetail (채널 상세)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"채널 알림","body":"영화맛집에서 새 영상이 업로드되었습니다!","data":{"version":"1.0","action":{"type":"NAVIGATION","screen":"ChannelDetail","params":{"channelId":"UCguwAEyC1STmy5vqgvNsX9A","channelName":"영화맛집"}}}}'
```

### UserContentList (찜 목록)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"찜 목록","body":"찜한 콘텐츠를 확인해보세요","data":{"version":"1.0","action":{"type":"NAVIGATION","screen":"UserContentList","params":{"initialTab":0}}}}'
```

### Settings (설정)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"설정 확인","body":"알림 설정을 확인해주세요","data":{"version":"1.0","action":{"type":"NAVIGATION","screen":"Settings","params":{}}}}'
```

### Search (검색)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"검색해보세요","body":"오늘의 추천 키워드: 느와르","data":{"version":"1.0","action":{"type":"NAVIGATION","screen":"Search","params":{}}}}'
```

### REQUEST_REVIEW (리뷰 요청)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"순삭은 어떠셨나요?","body":"별점을 남겨주세요!","data":{"version":"1.0","action":{"type":"ACTION","action":"REQUEST_REVIEW"}}}'
```

### 단순 푸시 (딥링크 없음)

```bash
curl -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' -H 'Content-Type: application/json' -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"안녕하세요!","body":"순삭에서 알려드립니다."}'
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.1 | 2025-02-17 | 한 줄 복사용 curl 명령어 추가 |
| 2.0 | 2025-02-17 | 딥링크 스펙 기반 전면 개편 |
| 1.0 | 2024-02-17 | 초기 버전 |
