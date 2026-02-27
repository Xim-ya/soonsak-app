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
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(sourceKeystore, targetKeystore);
        console.log('[withDebugKeystore] Copied debug.keystore from credentials/');
      }

      return config;
    },
  ]);
};

module.exports = withDebugKeystore;
