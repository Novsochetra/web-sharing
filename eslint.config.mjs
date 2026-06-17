import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'logs/**', 'uploads/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', '*.js', 'ecosystem.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        io: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
