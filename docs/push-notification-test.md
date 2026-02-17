# Push Notification 테스트 가이드

## 빠른 테스트 (복사해서 사용)

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"Test","body":"Hello"}'
```

## Edge Function 테스트 (curl)

### 기본 테스트

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"Test","body":"Hello"}'
```

### data 포함 테스트 (화면 이동 등)

```bash
curl -s -X POST 'https://hhgnrkejmkprfypwjhmz.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ25ya2VqbWtwcmZ5cHdqaG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTY5MDIsImV4cCI6MjA4NDI3MjkwMn0.LeU_-Cqik-pYC8xB3sj6r2eaon2QvaNxCfmBhzwWQlc' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"b5ec5a91-e64a-41ac-a9cb-046ab1695d29","title":"New Content","body":"Check out this movie!","data":{"screen":"ContentDetail","contentId":123}}'
```

## 요청 파라미터

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| user_id | string | O | 푸시를 받을 사용자 UUID |
| title | string | O | 알림 제목 |
| body | string | O | 알림 본문 |
| data | object | X | 추가 데이터 (화면 이동 등) |

## 응답 예시

### 토큰이 없는 경우

```json
{"success":false,"message":"No active push tokens found."}
```

### 전송 성공

```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "tickets": [{"status":"ok","id":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}]
}
```

### 필수 필드 누락

```json
{"error":"user_id, title, body are required."}
```

## 테스트 전 확인사항

1. 앱에서 해당 사용자로 로그인
2. 푸시 알림 권한 허용
3. `push_tokens` 테이블에 토큰 등록 확인

## 사용자 ID 조회 (Supabase SQL Editor)

```sql
SELECT id, email, display_name FROM profiles;
```

## 토큰 등록 확인 (Supabase SQL Editor)

```sql
SELECT user_id, token, platform, is_active FROM push_tokens;
```
