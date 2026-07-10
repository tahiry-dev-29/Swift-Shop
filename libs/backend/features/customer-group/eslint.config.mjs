import baseConfig from '../../../../eslint.config.mjs';

/** NestJS backend lib — Angular-only rules must not apply here */
const nestjsOverride = {
  files: ['**/*.ts'],
  rules: {
    '@angular-eslint/prefer-inject': 'off',
    '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    '@angular-eslint/prefer-standalone': 'off',
    '@angular-eslint/component-selector': 'off',
    '@angular-eslint/directive-selector': 'off',
    '@angular-eslint/no-input-rename': 'off',
    '@angular-eslint/no-inputs-metadata-property': 'off',
    '@angular-eslint/no-output-rename': 'off',
    '@angular-eslint/no-outputs-metadata-property': 'off',
    '@angular-eslint/no-output-on-prefix': 'off',
    '@angular-eslint/no-output-native': 'off',
    '@angular-eslint/contextual-lifecycle': 'off',
    '@angular-eslint/no-empty-lifecycle-method': 'off',
    '@angular-eslint/use-lifecycle-interface': 'off',
    '@angular-eslint/use-pipe-transform-interface': 'off',
  },
};

export default [...baseConfig, nestjsOverride];
