/* eslint-disable @typescript-eslint/no-require-imports */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      if (!podfileContent.includes('use_modular_headers!')) {
        podfileContent = podfileContent.replace(
          /^(target\s+'[^']+'\s+do)/m,
          'use_modular_headers!\n\n$1',
        );

        fs.writeFileSync(podfilePath, podfileContent);
        console.log('[withFirebaseModularHeaders] Added use_modular_headers! to Podfile');
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
