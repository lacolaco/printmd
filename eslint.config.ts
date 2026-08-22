import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import { inlineShortTemplates } from './tools/eslint-rules/inline-short-templates';
import { maxFunctionLines } from './tools/eslint-rules/max-function-lines';

export default defineConfig([
  {
    files: ['**/*.ts'],
    plugins: {
      printmd: {
        rules: {
          'inline-short-templates': inlineShortTemplates,
          'max-function-lines': maxFunctionLines,
        },
      },
    },
    rules: {
      'printmd/inline-short-templates': ['error', { maxLines: 20 }],
    },
  },
  {
    // 5 行ルールは実装コードに適用する (テストのコールバック本体は対象外)
    files: ['src/**/*.ts', 'tools/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'printmd/max-function-lines': ['error', { maxLines: 5 }],
    },
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // spec のフェイク実装は意図的な空メソッド (何もしないスタブ) を持つ
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
