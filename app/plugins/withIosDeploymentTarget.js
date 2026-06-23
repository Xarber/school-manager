const { withDangerousMod } = require('expo/config-plugins');
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const MIN_TARGET = '16.4';
const INJECTION_MARKER = '# [withIosDeploymentTarget]';

const INJECTION_CODE = `
  ${INJECTION_MARKER}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
      if current && current.to_f < ${MIN_TARGET}
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_TARGET}'
      end
    end
  end
  # [/withIosDeploymentTarget]`;

function withIosDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = resolve(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = readFileSync(podfilePath, 'utf-8');

      // Idempotent: already injected
      if (contents.includes(INJECTION_MARKER)) {
        return cfg;
      }

      // Match with optional leading whitespace, capture indent
      const POST_INSTALL_OPEN = /^([ \t]*)post_install do \|installer\|/m;
      const match = contents.match(POST_INSTALL_OPEN);

      if (!match) {
        throw new Error(
          '[withIosDeploymentTarget] Could not find `post_install do |installer|` in Podfile. ' +
          'The Podfile template may have changed — please update the plugin.'
        );
      }

      contents = contents.replace(
        POST_INSTALL_OPEN,
        `$1post_install do |installer|${INJECTION_CODE}`
      );

      writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
}

module.exports = withIosDeploymentTarget;