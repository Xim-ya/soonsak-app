/* eslint-disable @typescript-eslint/no-require-imports */
const { withProjectBuildGradle } = require('@expo/config-plugins');

const withKakaoMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const kakaoMaven = "maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }";

    if (!config.modResults.contents.includes('devrepo.kakao.com')) {
      const originalContents = config.modResults.contents;
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*{\s*repositories\s*{/,
        `allprojects {\n  repositories {\n    ${kakaoMaven}`
      );

      // regex 매칭 실패 시 경고 로그 출력
      if (originalContents === config.modResults.contents) {
        console.warn(
          '[withKakaoMaven] Failed to inject Kakao Maven repository. ' +
            'allprojects { repositories { pattern not found in build.gradle',
        );
      } else {
        console.log('[withKakaoMaven] Added Kakao Maven repository to build.gradle');
      }
    }

    return config;
  });
};

module.exports = withKakaoMaven;
