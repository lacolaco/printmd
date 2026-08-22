// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** インライン化の閾値。CLAUDE.md の指針と対で保つ */
const INLINE_TEMPLATE_MAX_LINES = 20;

/** @type {import('eslint').Rule.RuleModule} */
const inlineShortTemplates = {
  meta: {
    type: 'suggestion',
    messages: {
      inline:
        'テンプレートが {{lines}} 行 ({{max}} 行以下) のため、templateUrl ではなくインライン template にする',
    },
    schema: [],
  },
  create(context) {
    return {
      'Property[key.name="templateUrl"]'(node) {
        if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') return;
        const file = path.resolve(path.dirname(context.filename), node.value.value);
        let text;
        try {
          text = fs.readFileSync(file, 'utf-8');
        } catch {
          return;
        }
        const lines = text.replace(/\n$/, '').split('\n').length;
        if (lines <= INLINE_TEMPLATE_MAX_LINES) {
          context.report({
            node,
            messageId: 'inline',
            data: { lines: String(lines), max: String(INLINE_TEMPLATE_MAX_LINES) },
          });
        }
      },
    };
  },
};

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    plugins: {
      printmd: { rules: { 'inline-short-templates': inlineShortTemplates } },
    },
    rules: {
      'printmd/inline-short-templates': 'error',
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
