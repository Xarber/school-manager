const { withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAlternateIcons(config) {
  const icons = {
    default: 'icon-default.png',
    red: 'icon-red.png',
    blue: 'icon-blue.png',
  };

  // 🟣 1. Copia file dentro iOS
  config = withDangerousMod(config, ['ios', async (config) => {
    const projectRoot = config.modRequest.platformProjectRoot;
    const iosAssetsPath = path.join(projectRoot, config.modRequest.projectName, 'Images.xcassets');

    Object.values(icons).forEach(file => {
      const src = path.join(process.cwd(), 'assets/icons', file);
      const dest = path.join(iosAssetsPath, file);

      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });

    return config;
  }]);

  // 🟢 2. Config Info.plist (nomi SENZA path)
  config = withInfoPlist(config, (config) => {
    config.modResults.CFBundleIcons = {
      CFBundlePrimaryIcon: {
        CFBundleIconFiles: ['icon-default'],
      },
      CFBundleAlternateIcons: {
        red: {
          CFBundleIconFiles: ['icon-red'],
        },
        blue: {
          CFBundleIconFiles: ['icon-blue'],
        },
      },
    };

    return config;
  });

  return config;
};