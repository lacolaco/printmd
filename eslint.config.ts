import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import stylistic from '@stylistic/eslint-plugin';
import { callOrPass } from './tools/eslint-rules/call-or-pass';
import { ifOnlyAtStart } from './tools/eslint-rules/if-only-at-start';
import { inlineShortTemplates } from './tools/eslint-rules/inline-short-templates';
import { maxFunctionLines } from './tools/eslint-rules/max-function-lines';
import { noElse } from './tools/eslint-rules/no-else';
import { noSwitch } from './tools/eslint-rules/no-switch';

export default defineConfig([
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts', 'e2e/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@stylistic': stylistic,
      printmd: {
        rules: {
          'call-or-pass': callOrPass,
          'if-only-at-start': ifOnlyAtStart,
          'inline-short-templates': inlineShortTemplates,
          'max-function-lines': maxFunctionLines,
          'no-else': noElse,
          'no-switch': noSwitch,
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
      curly: ['error', 'all'],
      'no-sequences': ['error', { allowInParentheses: false }],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      'printmd/call-or-pass': 'error',
      'printmd/if-only-at-start': 'error',
      'printmd/max-function-lines': ['error', { maxLines: 5 }],
      'printmd/no-else': 'error',
      'printmd/no-switch': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { allowDefaultCaseForExhaustiveSwitch: false, requireDefaultForNonUnion: true },
      ],
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
