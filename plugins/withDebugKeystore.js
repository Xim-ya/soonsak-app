/* eslint-disable @typescript-eslint/no-require-imports */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withDebugKeystore = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const sourceKeystore = path.join(projectRoot, 'credentials', 'debug.keystore');
      const targetDir = path.join(projectRoot, 'android', 'app');
      const targetKeystore = path.join(targetDir, 'debug.keystore');

      if (fs.existsSync(sourceKeystore)) {
        try {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.copyFileSync(sourceKeystore, targetKeystore);
          console.log('[withDebugKeystore] Copied debug.keystore from credentials/');
        } catch (error) {
          console.error('[withDebugKeystore] Failed to copy debug.keystore:', error.message);
        }
      } else {
        console.log('[withDebugKeystore] Source keystore not found at:', sourceKeystore);
      }

      return config;
    },
  ]);
};

module.exports = withDebugKeystore;
