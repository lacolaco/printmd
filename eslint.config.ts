import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import stylistic from '@stylistic/eslint-plugin';
import { callOrPass } from './tools/eslint-rules/call-or-pass';
import { ifOnlyAtStart } from './tools/eslint-rules/if-only-at-start';
import { inlineShortTemplates } from './tools/eslint-rules/inline-short-templates';
import { maxFunctionLines } from './tools/eslint-rules/max-function-lines';
import { noClassInheritance } from './tools/eslint-rules/no-class-inheritance';
import { noCommonAffixes } from './tools/eslint-rules/no-common-affixes';
import { noElse } from './tools/eslint-rules/no-else';
import { noGetterSetter } from './tools/eslint-rules/no-getter-setter';
import { noSingleImplementationInterface } from './tools/eslint-rules/no-single-implementation-interface';
import { noSwitch } from './tools/eslint-rules/no-switch';
import { pureConditions } from './tools/eslint-rules/pure-conditions';

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
          'no-class-inheritance': noClassInheritance,
          'no-common-affixes': noCommonAffixes,
          'no-else': noElse,
          'no-getter-setter': noGetterSetter,
          'no-single-implementation-interface': noSingleImplementationInterface,
          'no-switch': noSwitch,
          'pure-conditions': pureConditions,
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
      complexity: ['error', { max: 5 }],
      curly: ['error', 'all'],
      'no-sequences': ['error', { allowInParentheses: false }],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      'printmd/call-or-pass': 'error',
      'printmd/if-only-at-start': 'error',
      'printmd/max-function-lines': ['error', { maxLines: 5 }],
      'printmd/no-class-inheritance': 'error',
      'printmd/no-common-affixes': 'error',
      'printmd/no-else': 'error',
      'printmd/no-getter-setter': 'error',
      'printmd/no-single-implementation-interface': 'error',
      'printmd/no-switch': 'error',
      'printmd/pure-conditions': 'error',
      // requireDefaultForNonUnion は printmd/no-switch の default 禁止と意図的に矛盾させる。
      // 両立不能にすることで、union 型以外を対象とする switch は書けない
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
