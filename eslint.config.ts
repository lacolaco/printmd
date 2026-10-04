import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import stylistic from '@stylistic/eslint-plugin';
import stoicAngular from 'eslint-plugin-stoic-angular';
import { maxDirectoryEntries } from './tools/eslint-rules/structure/max-directory-entries';
import { noCommonAffixes } from './tools/eslint-rules/classes/no-common-affixes';
import { noDataClump } from './tools/eslint-rules/classes/no-data-clump';
import { noGetterSetter } from './tools/eslint-rules/classes/no-getter-setter';
import { noSingleImplementationInterface } from './tools/eslint-rules/classes/no-single-implementation-interface';
import { pureConditions } from './tools/eslint-rules/functions/pure-conditions';
import { componentSignature } from './tools/eslint-rules/angular/component-signature';
import { injectableJsdoc } from './tools/eslint-rules/angular/injectable-jsdoc';
import { vmSignature } from './tools/eslint-rules/angular/vm-signature';
import { noStateOnlyService } from './tools/eslint-rules/structure/no-state-only-service';

/** 層の定義 (依存方向と層固有ルール)。層の追加・変更はこの配列だけを編集する */
const LAYERS = [
  {
    // shared は feature に依存しない
    files: ['src/app/shared/**/*.ts'],
    patterns: [{ group: ['**/feature/**'], message: 'shared は feature に依存しない' }],
  },
  {
    files: ['src/app/shared/markdown/**/*.ts'],
    patterns: [
      {
        group: ['**/feature/**', '**/mermaid/**'],
        message: 'markdown 層は feature と mermaid に依存しない',
      },
    ],
  },
  {
    files: ['src/app/shared/mermaid/**/*.ts'],
    patterns: [{ group: ['**/feature/**'], message: 'mermaid 層は feature に依存しない' }],
  },
  {
    // shared 内の依存方向: manuscript ← conversion-pipeline ← pagination
    files: ['src/app/shared/manuscript/**/*.ts'],
    patterns: [
      { group: ['**/feature/**'], message: 'shared は feature に依存しない' },
      {
        group: ['**/pagination/**', '**/conversion-pipeline'],
        message: 'manuscript は shared の下層。pagination / conversion-pipeline に依存しない',
      },
    ],
  },
  {
    files: ['src/app/shared/conversion-pipeline.ts'],
    patterns: [
      { group: ['**/feature/**'], message: 'shared は feature に依存しない' },
      { group: ['**/pagination/**'], message: 'conversion-pipeline は pagination に依存しない' },
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
          'max-directory-entries': maxDirectoryEntries,
          'no-common-affixes': noCommonAffixes,
          'no-data-clump': noDataClump,
          'no-getter-setter': noGetterSetter,
          'no-single-implementation-interface': noSingleImplementationInterface,
          'pure-conditions': pureConditions,
          'component-signature': componentSignature,
          'injectable-jsdoc': injectableJsdoc,
          'vm-signature': vmSignature,
          'no-state-only-service': noStateOnlyService,
        },
      },
    },
  },
  {
    files: ['**/*.ts'],
    extends: [stoicAngular.configure({ 'prefer-inline-template': { maxLines: 20 } })],
  },
  {
    // 5 行ルールなどは実装コードに適用する (テストのコールバック本体は対象外)
    files: ['src/**/*.ts', 'tools/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    extends: [
      stoicAngular.configure({
        'call-or-pass': true,
        complexity: 5,
        'if-only-at-start': true,
        'max-function-lines': { maxLines: 5 },
        'no-class-inheritance': true,
        'no-else': true,
        'no-inline-union': true,
        'no-sequences': { allowInParentheses: false },
        'no-switch': true,
      }),
    ],
  },
  {
    files: ['src/**/*.ts', 'tools/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      curly: ['error', 'all'],
      'max-classes-per-file': ['error', 1],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      'printmd/max-directory-entries': 'error',
      'printmd/no-common-affixes': 'error',
      'printmd/no-data-clump': 'error',
      'no-void': 'error',
      'printmd/no-getter-setter': 'error',
      'printmd/no-single-implementation-interface': 'error',
      'printmd/pure-conditions': 'error',
      'printmd/component-signature': 'error',
      'printmd/injectable-jsdoc': 'error',
      'printmd/vm-signature': 'error',
      'printmd/no-state-only-service': 'error',
      // requireDefaultForNonUnion は stoic-angular/no-switch の default 禁止と意図的に矛盾させる。
      // 両立不能にすることで、union 型以外を対象とする switch は書けない
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { allowDefaultCaseForExhaustiveSwitch: false, requireDefaultForNonUnion: true },
      ],
    },
  },
  // 依存方向の規律: feature → shared (ドメイン) → markdown / mermaid。
  // 逆向きの import を層ごとに禁止する (型 import も含む)。spec はダブルの注入で層を跨げる
  ...LAYERS.map((layer) => ({
    files: layer.files,
    ignores: [...(layer.ignores ?? []), '**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: layer.patterns }],
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
