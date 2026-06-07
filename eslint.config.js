import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'build', 'node_modules', 'public']),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    plugins: {
      prettier: prettierPlugin,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
    languageOptions: {
      globals: globals.browser,
      sourceType: 'module',
    },
  },
]);
