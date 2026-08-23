import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import stylistic from '@stylistic/eslint-plugin';
import { callOrPass } from './tools/eslint-rules/functions/call-or-pass';
import { ifOnlyAtStart } from './tools/eslint-rules/functions/if-only-at-start';
import { inlineShortTemplates } from './tools/eslint-rules/angular/inline-short-templates';
import { maxDirectoryEntries } from './tools/eslint-rules/structure/max-directory-entries';
import { maxFunctionLines } from './tools/eslint-rules/functions/max-function-lines';
import { noClassInheritance } from './tools/eslint-rules/classes/no-class-inheritance';
import { noCommonAffixes } from './tools/eslint-rules/classes/no-common-affixes';
import { noDataClump } from './tools/eslint-rules/classes/no-data-clump';
import { noElse } from './tools/eslint-rules/functions/no-else';
import { noGetterSetter } from './tools/eslint-rules/classes/no-getter-setter';
import { noNewInProps } from './tools/eslint-rules/angular/no-new-in-props';
import { noPrivateComponentMethods } from './tools/eslint-rules/angular/no-private-component-methods';
import { noSingleImplementationInterface } from './tools/eslint-rules/classes/no-single-implementation-interface';
import { noSwitch } from './tools/eslint-rules/functions/no-switch';
import { pureConditions } from './tools/eslint-rules/functions/pure-conditions';
import { requireState } from './tools/eslint-rules/structure/require-state';

/** 層の定義 (依存方向と層固有ルール)。層の追加・変更はこの配列だけを編集する */
const LAYERS = [
  {
    // state には状態 (@Service の状態クラス) だけを置く
    files: ['src/app/state/**/*.ts'],
    patterns: [
      { group: ['**/components/**'], message: 'state は components に依存しない' },
      { group: ['**/mermaid/**'], message: 'state は変換の実装に依存しない。Converter を経由する' },
      {
        group: ['**/manuscript/**', '!**/manuscript/converter', '!**/manuscript/manuscript'],
        message: 'state は操作ロジックに依存しない。判断は Editor が担い、状態は結果を受けるだけ',
      },
    ],
    rules: { 'printmd/require-state': 'error' },
  },
  {
    files: ['src/app/markdown/**/*.ts'],
    patterns: [
      {
        group: ['**/state/**', '**/components/**', '**/mermaid/**'],
        message: 'markdown 層は上位層と mermaid に依存しない',
      },
    ],
  },
  {
    files: ['src/app/mermaid/**/*.ts'],
    patterns: [
      { group: ['**/state/**', '**/components/**'], message: 'mermaid 層は上位層に依存しない' },
    ],
  },
  {
    // src/app 直下のドメインモジュール。app.ts だけは画面骨格なので除外する
    files: ['src/app/*.ts', 'src/app/pagination/**/*.ts', 'src/app/manuscript/**/*.ts'],
    ignores: ['src/app/app.ts'],
    patterns: [
      {
        group: ['**/state/**', '**/components/**'],
        message: 'ドメインモジュールは上位層に依存しない',
      },
    ],
  },
];

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
          'max-directory-entries': maxDirectoryEntries,
          'max-function-lines': maxFunctionLines,
          'no-class-inheritance': noClassInheritance,
          'no-common-affixes': noCommonAffixes,
          'no-data-clump': noDataClump,
          'no-else': noElse,
          'no-getter-setter': noGetterSetter,
          'no-new-in-props': noNewInProps,
          'no-private-component-methods': noPrivateComponentMethods,
          'no-single-implementation-interface': noSingleImplementationInterface,
          'no-switch': noSwitch,
          'pure-conditions': pureConditions,
          'require-state': requireState,
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
      'max-classes-per-file': ['error', 1],
      'no-sequences': ['error', { allowInParentheses: false }],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      'printmd/call-or-pass': 'error',
      'printmd/if-only-at-start': 'error',
      'printmd/max-directory-entries': 'error',
      'printmd/max-function-lines': ['error', { maxLines: 5 }],
      'printmd/no-class-inheritance': 'error',
      'printmd/no-common-affixes': 'error',
      'printmd/no-data-clump': 'error',
      'printmd/no-else': 'error',
      'printmd/no-getter-setter': 'error',
      'printmd/no-new-in-props': 'error',
      'printmd/no-private-component-methods': 'error',
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
  // 依存方向の規律: components → state → ドメイン (src/app 直下) → markdown / mermaid。
  // 逆向きの import を層ごとに禁止する (型 import も含む)。spec はダブルの注入で層を跨げる
  ...LAYERS.map((layer) => ({
    files: layer.files,
    ignores: [...(layer.ignores ?? []), '**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: layer.patterns }],
      ...(layer.rules ?? {}),
    },
  })),
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
