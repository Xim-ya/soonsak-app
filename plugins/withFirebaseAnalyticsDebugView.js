/**
 * Expo Config Plugin: Firebase Analytics DebugView 활성화
 *
 * iOS: Xcode 스키마에 -FIRAnalyticsDebugEnabled 런치 인자 추가
 * Android: AndroidManifest.xml에 firebase_analytics_collection_deactivated 메타데이터 추가
 *
 * @see https://firebase.google.com/docs/analytics/debugview
 * @see https://github.com/invertase/react-native-firebase/discussions/6497
 */

const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const COMMAND_LINE_ARG = '-FIRAnalyticsDebugEnabled';

/**
 * iOS: xcscheme에 -FIRAnalyticsDebugEnabled 런치 인자 추가
 */
function withFirebaseAnalyticsDebugViewIOS(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectName = config.modRequest.projectName;
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      const schemePath = path.join(
        platformProjectRoot,
        `${projectName}.xcodeproj`,
        'xcshareddata',
        'xcschemes',
        `${projectName}.xcscheme`,
      );

      if (!fs.existsSync(schemePath)) {
        console.warn(`[withFirebaseAnalyticsDebugView] xcscheme file not found: ${schemePath}`);
        return config;
      }

      let schemeXml = fs.readFileSync(schemePath, 'utf8');

      if (schemeXml.includes(COMMAND_LINE_ARG)) {
        console.log(`[withFirebaseAnalyticsDebugView] iOS: ${COMMAND_LINE_ARG} already exists`);
        return config;
      }

      if (schemeXml.includes('<CommandLineArguments>')) {
        schemeXml = schemeXml.replace(
          '<CommandLineArguments>',
          `<CommandLineArguments>
         <CommandLineArgument
            argument = "${COMMAND_LINE_ARG}"
            isEnabled = "YES">
         </CommandLineArgument>`,
        );
      } else {
        schemeXml = schemeXml.replace(
          '</LaunchAction>',
          `   <CommandLineArguments>
         <CommandLineArgument
            argument = "${COMMAND_LINE_ARG}"
            isEnabled = "YES">
         </CommandLineArgument>
      </CommandLineArguments>
   </LaunchAction>`,
        );
      }

      fs.writeFileSync(schemePath, schemeXml);
      console.log(`[withFirebaseAnalyticsDebugView] iOS: Added ${COMMAND_LINE_ARG} to scheme`);

      return config;
    },
  ]);
}

/**
 * Android: firebase.json의 analytics_debug_enabled 설정으로 처리됨
 * @see firebase.json
 */

module.exports = (config) => {
  return withFirebaseAnalyticsDebugViewIOS(config);
};
