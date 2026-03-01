import { TMDB_API_KEY, TMDB_BASE_URL } from '@/features/tmdb/config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { snakeToCamel } from '@/shared/utils/caseConverter';

/**
 * TMDB Axios 기본 클라이언트
 * 공통 설정 및 interceptors 포함
 */
export const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'ko',
  },
  timeout: 10000,
});

// 응답 interceptor - snake_case를 camelCase로 변환 및 에러 처리
tmdbClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // snake_case를 camelCase로 변환
    if (response.data) {
      response.data = snakeToCamel(response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.data) {
      const tmdbError = error.response.data as {
        success: boolean;
        status_message: string;
        status_code: number;
      };
      if (tmdbError.success === false) {
        throw new Error(
          `TMDB API 오류: ${tmdbError.status_message} (코드: ${tmdbError.status_code})`,
        );
      }
    }
    console.error('TMDB API 요청 실패:', error);
    throw error;
  },
);
