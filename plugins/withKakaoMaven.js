const { withProjectBuildGradle } = require('@expo/config-plugins');

const withKakaoMaven = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const kakaoMaven = "maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }";

    if (!config.modResults.contents.includes('devrepo.kakao.com')) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*{\s*repositories\s*{/,
        `allprojects {\n  repositories {\n    ${kakaoMaven}`
      );
    }

    return config;
  });
};

module.exports = withKakaoMaven;
