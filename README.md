
<h1 align="center">순삭</h1>
<p align="center"><img src="https://velog.velcdn.com/images/ximya_hf/post/63cec215-49cc-4b9d-a225-a4f2f2bc1267/image.png"/></p>
  <p align="center">                                                                                           
  <b>순삭</b>은 <b>10,000편 이상</b>의  <b>유튜브 영화·드라마 리뷰 영상<b/>을<br/>                                            
  결말까지 깔끔하고 쉽게 즐길 수 있는 서비스입니다.                                                                   
  </p>                                                                                                         
                  


<p align="center">
  <a href="https://apps.apple.com/kr/app/%EC%88%9C%EC%82%AD-%EC%98%81%ED%99%94-%EB%93%9C%EB%9D%BC%EB%A7%88-%EC%9A%94%EC%95%BD-%EB%A6%AC%EB%B7%B0-%EC%BD%98%ED%85%90%EC%B8%A0/id6758769228">
    <img src="https://velog.velcdn.com/images/ximya_hf/post/94c5604a-f8e9-4979-9578-7a8e17d72af8/image.png"
      alt="Platform" />
  </a>
  <a href="https://play.google.com/store/apps/details?id=com.soonsak.app&hl=ko">
    <img src="https://velog.velcdn.com/images/ximya_hf/post/db4639d8-2241-4a87-a393-0ee64961237d/image.png"
      alt="Pub Package"/>
  </a>
</p>

<br>




# 목차

- [전환](#요약)
- [폴더 구조](#폴더-구조)
- [소개 페이지](#소개-페이지)
- [컨트리뷰터](#컨트리뷰터-)




<br/>


# 전환
> 본 프로젝트는 기존 Flutter 프로젝트 [Plotz](https://github.com/Xim-ya/Plotz)를 React Native로 전환한 프로젝트입니다.

| Index       | Plotz (Before)                        | 순삭 (After)                        |
|-------------|--------------------------------------|-------------------------------------|
| 프레임워크    | Flutter                              | React Native (Expo)                 |
| 언어         | Dart                                 | TypeScript                          |
| 아키텍처      | Clean MVVM                           | Feature-based Architecture          |
| 상태관리      | Provider, RxDart                     | TanStack Query, Context API         |
| DI          | get_it                               | -                                   |
| 라우팅        | go_router                            | React Navigation                    |
| 네트워킹      | Dio, Retrofit                        | Supabase Client                     |
| 로컬 DB      | sembast, Hive                        | AsyncStorage                        |
| 스타일링      | -                                    | Emotion                             |
| Backend     | Firebase (Firestore, Realtime DB)    | Supabase, NestJS                    |
| 인증         | Firebase Auth                        | Supabase Auth (Google, Kakao, Apple)|
| 애널리틱스    | Firebase Analytics, Crashlytics      | Firebase Analytics, Sentry          |


<br/>

# 소개 페이지

<table>
  <tr>
<td align="center"><img src="https://velog.velcdn.com/images/ximya_hf/post/aee256ca-d34c-41a5-829d-ec00ac0d24a0/image.png"/></td>
<td align="center"><img src="https://velog.velcdn.com/images/ximya_hf/post/38b362c1-bf05-4b52-8b93-5bc8e60a767f/image.png"/></td>
<td align="center"><img src="https://velog.velcdn.com/images/ximya_hf/post/44569aca-0868-43a6-b25d-68a6d2cc9da4/image.png"/></td>
<td align="center"><img src="https://velog.velcdn.com/images/ximya_hf/post/d5471763-0f19-44fa-9c90-771202e795ff/image.png"/></td>
<td align="center"><img src="https://velog.velcdn.com/images/ximya_hf/post/93f7e75d-c86c-47f5-a2ad-8ccc022fea40/image.png"/></td>
  </tr>
</table>

<br/>


# 폴더 구조

```bash
|-- src
    |-- core                    # 인프라 레이어
    |   |-- api                 # Supabase 클라이언트
    |   |-- config              # 설정 상수
    |   |-- services            # 애널리틱스, 웹훅
    |   |-- types               # 공통 타입
    |   |-- utils               # 유틸리티 함수
    |
    |-- features                # 기능 모듈
    |   |-- auth                # 인증 (Google, Kakao, Apple)
    |   |-- channel             # 채널/크리에이터
    |   |-- content             # 영화/드라마 콘텐츠
    |   |-- favorites           # 찜 목록
    |   |-- push-notifications  # 푸시 알림
    |   |-- recommendations     # 개인화 추천
    |   |-- tmdb                # TMDB API 연동
    |   |-- youtube             # YouTube 연동
    |
    |-- presentation            # UI 레이어
        |-- components          # 공통 컴포넌트
        |-- hooks               # 커스텀 훅
        |-- screens             # 화면 컴포넌트
        |-- navigation          # 네비게이션
        |-- providers           # Context Providers
        |-- styles              # 스타일, 테마

```


