import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    // Ex-.eslintignore + ignorePatterns de l'ancien .eslintrc.json
    ignores: [
      'duplicate/**',
      'coverage/**',
      'src/output.js',
      'test/corpus/*.js',
      'dist/reports/**/*.js'
    ]
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.vitest
      }
    },
    linterOptions: {
      // Comportement ESLint 8 conservé : pas de signalement des eslint-disable inutilisés
      reportUnusedDisableDirectives: 'off'
    },
    rules: {
      'no-prototype-builtins': 'off',
      'no-irregular-whitespace': 'off'
    }
  }
];
