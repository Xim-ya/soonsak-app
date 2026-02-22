/**
 * 네비게이션 타입 정의 파일
 *
 * 이 파일은 React Navigation의 타입 안전성을 보장하고 하드코딩을 방지하기 위해 존재합니다.
 * routePages 객체를 기반으로 모든 네비게이션 관련 타입을 중앙에서 관리합니다.
 *
 * 장점:
 * 1. 하드코딩 방지: 화면 이름 변경 시 routePages에서만 수정
 * 2. 타입 안전성: 잘못된 화면 이름이나 파라미터 사용 시 컴파일 에러
 * 3. 자동완성: IDE에서 화면 이름과 파라미터 자동완성 지원
 * 4. 유지보수성: 새로운 화면 추가 시 일관된 패턴 적용
 */

import { routePages } from '../constant/routePages';
import { ContentType } from '@/presentation/types/content/contentType.enum';
import type { ProfileSetupMode } from '@/features/user/types';

// routePages 객체의 값들을 Union 타입으로 추출
// 예: "MainTabs" | "ContentDetail"
export type RouteNames = (typeof routePages)[keyof typeof routePages];

// 사용자 콘텐츠 목록 초기 탭 인덱스
export type UserContentListTabIndex = 0 | 1 | 2; // 0: 찜했어요, 1: 평가했어요, 2: 봤어요

/**
 * 콘텐츠 상세 페이지 초기 데이터
 * 이전 화면에서 알고 있는 데이터를 전달하여 API 응답 전에 미리 표시
 */
export interface ContentDetailInitialData {
  backdropPath?: string;
  posterPath?: string;
  /** 시청 진행률 (초) - 이어보기 표시용 */
  progressSeconds?: number;
  /** 전체 재생 시간 (초) - 진행률 계산용 */
  durationSeconds?: number;
}

/**
 * 스택 네비게이션의 파라미터 타입 정의
 *
 * routePages 객체의 키를 사용하여 하드코딩을 방지합니다.
 * 새로운 화면 추가 시 이 타입에 추가하면 됩니다.
 *
 * 사용 예:
 * - navigation.navigate(routePages.contentDetail, { id: "123" })
 * - 잘못된 파라미터 전달 시 컴파일 에러 발생
 */
export type RootStackParamList = {
  [routePages.login]:
    | {
        canGoBack?: boolean;
        onLoginSuccess?: () => void; // 로그인 성공 후 실행할 콜백 (찜/평점 등)
      }
    | undefined; // 로그인 - canGoBack, onLoginSuccess 선택적 파라미터
  [routePages.mainTabs]: undefined; // 탭 네비게이터 - 파라미터 없음
  [routePages.contentDetail]: {
    id: number; // 콘텐츠 ID
    title?: string | null; // 콘텐츠 제목 (선택)
    type: ContentType; // 콘텐츠 타입 (movie | series | unknown)
    videoId?: string; // 특정 비디오 ID (선택 - 없으면 primary 비디오 사용)
    initialData?: ContentDetailInitialData; // 프리로드 데이터 (선택 - 배경 이미지 등)
  }; // 콘텐츠 상세 - id, type 필수, title, videoId, initialData 선택
  [routePages.player]: {
    videoId: string;
    title: string;
    contentId: number; // 재생수 증가용
    contentType: ContentType; // 재생수 증가용
    startSeconds?: number; // 이어보기 시작 시간 (초)
  }; // 플레이어 - 비디오 ID, 제목, 콘텐츠 정보 필수, 이어보기 시간 선택
  [routePages.channelDetail]: {
    channelId: string; // YouTube 채널 ID (필수)
    channelName?: string; // 채널 이름 (선택 - 없으면 API 조회)
    channelLogoUrl?: string; // 채널 로고 URL (선택 - 없으면 API 조회)
    subscriberCount?: number; // 구독자 수 (선택 - 없으면 API 조회)
  }; // 채널 상세 - channelId만 필수, 나머지는 API로 조회 가능
  [routePages.search]: undefined; // 검색 - 파라미터 없음
  [routePages.channelSelection]: {
    selectedChannelIds: string[]; // 현재 선택된 채널 ID 목록
  }; // 채널 선택 - 바텀시트에서 전체 채널 선택 시 사용
  [routePages.mediaList]: {
    contentId: number;
    contentType: ContentType;
    backdropPath: string; // 헤더 이미지 제외용
  }; // 스틸컷 목록 - 콘텐츠 정보 필수
  [routePages.imageDetail]: {
    contentId: number;
    contentType: ContentType;
    backdropPath: string; // 헤더 이미지 제외용
    initialIndex: number; // 시작 이미지 인덱스
  }; // 이미지 상세 뷰어 - 콘텐츠 정보 + 시작 인덱스 필수
  [routePages.profileSetup]: {
    mode: ProfileSetupMode; // 프로필 설정 모드 (initial | edit)
  }; // 프로필 설정 - 모드 필수
  [routePages.settings]: undefined; // 설정 - 파라미터 없음
  [routePages.userContentList]: {
    initialTab?: UserContentListTabIndex; // 초기 활성화 탭 인덱스 (기본값: 0)
  }; // 사용자 콘텐츠 목록 - 탭 인덱스 선택
  [routePages.watchHistory]: {
    date?: string; // 특정 날짜 필터 (YYYY-MM-DD 형식, 없으면 전체 시청 기록)
  }; // 시청 기록 - 날짜 필터 선택
  [routePages.quickExplore]: undefined; // 빠른탐색 - 파라미터 없음
  [routePages.adminContentSearch]: {
    videoId: string; // 교체할 비디오 ID
    videoTitle: string; // 비디오 제목 (UI 표시용)
    currentContentId: number; // 현재 매핑된 콘텐츠 ID
    currentContentType: ContentType; // 현재 매핑된 콘텐츠 타입
    currentContentTitle: string; // 현재 콘텐츠 제목
    currentContentReleaseYear: string | null; // 현재 콘텐츠 개봉/방영 연도
  }; // 어드민 콘텐츠 검색 - 비디오를 다른 콘텐츠로 교체할 때 사용
  [routePages.adminPrimaryVideoSelect]: {
    contentId: number; // 콘텐츠 ID
    contentType: ContentType; // 콘텐츠 타입
    contentTitle: string; // 콘텐츠 제목 (UI 표시용)
  }; // 어드민 대표 비디오 선택 - 콘텐츠의 비디오 목록에서 대표 비디오 변경
};

/**
 * 탭 네비게이션의 파라미터 타입 정의
 *
 * 각 탭 화면의 파라미터를 정의합니다.
 * 현재는 모든 탭이 파라미터가 없지만, 필요 시 추가할 수 있습니다.
 */
/** 탐색 탭 정렬 타입 */
export type ExploreTabName = 'all' | 'latest' | 'popular' | 'recommended';

export type TabParamList = {
  Home: undefined; // 홈 탭
  Explore: { initialTab?: ExploreTabName } | undefined; // 탐색 탭 - 초기 탭 선택
  Channel: undefined; // 채널 탭
  My: undefined; // MY 탭
};

/**
 * 유틸리티 타입들 - 각 화면에서 쉽게 사용할 수 있도록 제공
 *
 * 사용 예:
 * type MyScreenRouteProp = ScreenRouteProp<typeof routePages.contentDetail>;
 *
 * 이렇게 하면 하드코딩 없이 해당 화면의 route 파라미터 타입을 얻을 수 있습니다.
 */

// 각 화면에서 route.params 타입을 정의할 때 사용
export type ScreenRouteProp<T extends RouteNames> = import('@react-navigation/native').RouteProp<
  RootStackParamList,
  T
>;

// 각 화면에서 navigation 객체 타입을 정의할 때 사용 (필요한 경우에만)
// 단순한 goBack() 사용 시에는 불필요하지만, navigate() 등을 사용할 때는 필요
// export type ScreenNavigationProp<T extends RouteNames> =
//   import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList, T>;

/**
 * 전체 구조 설명:
 *
 * 1. routePages (constant/routePages.ts) - 화면 이름 상수 정의
 * 2. 이 파일 (types/index.ts) - 네비게이션 타입 정의
 * 3. utils/index.ts - 네비게이션 유틸리티 함수들
 * 4. 각 화면 - ScreenRouteProp 등을 사용하여 타입 안전성 보장
 *
 * 이 구조를 통해 화면 이름 변경 시 routePages에서만 수정하면
 * 전체 앱에서 자동으로 반영됩니다.
 */
