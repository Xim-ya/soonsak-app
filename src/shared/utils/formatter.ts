const formatter = {
  TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/',

  /**
   * 숫자를 영어 서수로 변환 (1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, etc.)
   * @param num 변환할 숫자
   * @returns 서수 문자열
   */
  toOrdinal(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = num % 100;

    if (value >= 11 && value <= 13) {
      return `${num}th`;
    }

    const suffix = suffixes[value % 10] ?? 'th';
    return `${num}${suffix}`;
  },

  /**
   * TMDB 이미지 URL을 생성하는 유틸리티 함수
   * @param imgId 이미지 파일명
   * @param size 이미지 사이즈 (예: 'w500', 'original' 등), 기본값은 'original'
   * */
  prefixTmdbImgUrl(
    imgId: string,
    { size = TmdbImageSize.original }: { size?: TmdbImageSize } = {},
  ): string {
    if (!imgId) return '';
    return `${this.TMDB_IMAGE_BASE_URL}${size}/${imgId}`;
  },

  /**
   * 좋아요 수 & 조회수 & 구독자 수를 유튜브 포맷에 맞게 변경
   * 1000 미만 -> 숫자 ex) 956
   * 1000 이상 -> 천 단위 ex) 1.4천
   * 10000 이상 -> 만 단위 ex) 32만, 이때는 소숫점 없음 && 41000 -> 4.1만
   * @param num 포맷팅할 숫자
   * @param isViewCount 조회수 여부 (true면 '천회', '만회' 사용)
   * @returns 포맷팅된 문자열
   */
  formatNumberWithUnit(num: number | null | undefined, isViewCount: boolean = false): string {
    if (num == null) return '-';

    const strNum = num.toString();

    if (num <= 1000) {
      return num.toString();
    } else if (num > 1000 && num < 10000) {
      // 1000 이상 10000 미만: 1.4천 형태 (소수점이 0이면 생략: 2.0천 -> 2천)
      const subString = strNum.substring(0, 2);
      const suffix = isViewCount ? '천회' : '천';
      if (subString.charAt(1) === '0') {
        return `${subString.charAt(0)}${suffix}`;
      }
      return `${subString.charAt(0)}.${subString.charAt(1)}${suffix}`;
    } else if (num >= 10000) {
      if (strNum.length === 5) {
        // 5자리 수 (10000~99999): 1.2만 형태 (소수점이 0이면 생략: 2.0만 -> 2만)
        const subString = strNum.substring(0, 2);
        const suffix = isViewCount ? '만회' : '만';
        if (subString.charAt(1) === '0') {
          return `${subString.charAt(0)}${suffix}`;
        }
        return `${subString.charAt(0)}.${subString.charAt(1)}${suffix}`;
      } else {
        // 6자리 이상: 소숫점 없음, 32만 형태
        const result = strNum.substring(0, strNum.length - 4);
        return `${result}${isViewCount ? '만회' : '만'}`;
      }
    } else {
      return '-';
    }
  },

  /**
   * 현재 일을 기준으로 인자로 받은 '날짜'를 계산하여 일정 포맷으로 리턴함
   * @param dateString 날짜 문자열 (ISO format)
   * @returns 시간 차이 문자열 (예: 3초 전, 2분 전, 1시간 전, 5일 전, 2달 전, 1년 전)
   */
  getDateDifferenceFromNow(dateString: string | null | undefined): string {
    if (!dateString) return '-';

    try {
      const targetDate = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return `${diffInSeconds}초 전`;
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}분 전`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}시간 전`;
      } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
      } else if (diffInSeconds < 31536000) {
        return `${Math.floor(diffInSeconds / 2592000)}달 전`;
      } else {
        return `${Math.floor(diffInSeconds / 31536000)}년 전`;
      }
    } catch {
      return '-';
    }
  },

  /**
   * 장르 리스트를 '/' 구분자로 연결
   * @param genreList 장르 배열
   * @returns 연결된 문자열 (예: '드라마 / 액션 / 멜로')
   */
  formatGenreListToSingleStr(genreList: string[] | null | undefined): string {
    return genreList == null ? '-' : genreList.join(' / ');
  },

  /**
   * 장르 리스트를 '·' 구분자로 연결
   * @param genreList 장르 배열
   * @returns 연결된 문자열 (예: '드라마 · 액션 · 멜로')
   */
  splitGenresByDots(genreList: string[] | null | undefined): string {
    return genreList == null ? '' : genreList.join(' · ');
  },

  /**
   * 날짜를 yy.MM.dd 형식으로 포맷팅
   * @param date 날짜 문자열
   * @returns 포맷팅된 날짜 (예: '24.01.15')
   */
  dateToyyMMdd(date: string): string {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  },

  /**
   * 날짜를 yyyy 형식으로 포맷팅
   * @param date 날짜 문자열
   * @returns 연도 (예: '2024')
   */
  dateToYear(date: string): string {
    return new Date(date).getFullYear().toString();
  },

  /**
   * 날짜를 yyyy.MM.dd 형식으로 포맷팅
   * @param date 날짜 문자열
   * @returns 포맷팅된 날짜 (예: '2024.01.15')
   */
  dateToyyyyMMdd(date: string): string {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  },

  /**
   * DateTime 객체를 yyyy.MM.dd 형식으로 포맷팅
   * @param dateTime Date 객체
   * @returns 포맷팅된 날짜 (예: '2024.01.15')
   */
  parseDateToyyyyMMdd(dateTime: Date): string {
    const year = dateTime.getFullYear();
    const month = (dateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = dateTime.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  },

  /**
   * 초 단위 런타임을 유튜브 스타일로 변환
   * @param seconds 초 단위 런타임
   * @returns 유튜브 포맷 (예: '3:45', '1:23:45')
   */
  formatRuntime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const paddedSecs = secs.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${paddedSecs}`;
    }
    return `${mins}:${paddedSecs}`;
  },

  /**
   * 유튜브 비디오 링크에서 비디오 ID 추출
   * @param url 유튜브 URL
   * @returns 비디오 ID 또는 null
   */
  getVideoIdFromYoutubeUrl(url: string): string | null | undefined {
    const regex =
      /.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  },
};

export enum TmdbImageSize {
  w92 = 'w92',
  w154 = 'w154',
  w185 = 'w185',
  w342 = 'w342',
  w500 = 'w500',
  w780 = 'w780',
  original = 'original',
}

export { formatter };
