import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Rule } from 'eslint';

const DEFAULT_MAX_LINES = 20;

/**
 * templateUrl の参照先の行数を実測し、閾値以下ならインライン template を要求する。
 * 閾値はオプション { maxLines } で変えられる (既定 20)
 */
export const inlineShortTemplates: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    messages: {
      inline:
        'テンプレートが {{lines}} 行 ({{max}} 行以下) のため、templateUrl ではなくインライン template にする',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxLines: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = (context.options[0] ?? {}) as { maxLines?: number };
    const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
    return {
      'Property[key.name="templateUrl"]'(node: Rule.Node) {
        if (node.type !== 'Property') return;
        if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') return;
        const file = path.resolve(path.dirname(context.filename), node.value.value);
        let text: string;
        try {
          text = fs.readFileSync(file, 'utf-8');
        } catch {
          return;
        }
        const lines = text.replace(/\n$/, '').split('\n').length;
        if (lines <= maxLines) {
          context.report({
            node,
            messageId: 'inline',
            data: { lines: String(lines), max: String(maxLines) },
          });
        }
      },
    };
  },
};
