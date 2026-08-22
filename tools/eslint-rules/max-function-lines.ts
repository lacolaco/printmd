import type { Rule, SourceCode } from 'eslint';
import type { Node } from 'estree';

const DEFAULT_MAX_LINES = 5;

/** ロジックの無い行 (空行、および { } ( ) [ ] ; , だけの行) は数えない */
const PUNCTUATION_ONLY = /^[{}()[\];,]*$/;

function countLogicLines(sourceCode: SourceCode, body: Node): number {
  const lines = sourceCode.getText(body as Parameters<SourceCode['getText']>[0]).split('\n');
  return lines.filter((line) => !PUNCTUATION_ONLY.test(line.trim())).length;
}

function check(context: Rule.RuleContext, maxLines: number, node: Rule.Node): void {
  const body = (node as Node & { body: Node }).body;
  const lines = countLogicLines(context.sourceCode, body);
  if (lines > maxLines) {
    context.report({ node, messageId: 'tooLong', data: { lines: String(lines), max: String(maxLines) } });
  }
}

/** 5 行ルール: 関数・メソッドの本体はロジックのある行が maxLines 行以内 (既定 5) */
export const maxFunctionLines: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    messages: {
      tooLong:
        '関数本体にロジックのある行が {{lines}} 行ある。{{max}} 行以内に分割する (5 行ルール)',
    },
    schema: [
      {
        type: 'object',
        properties: { maxLines: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = (context.options[0] ?? {}) as { maxLines?: number };
    const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
    const listener = (node: Rule.Node) => check(context, maxLines, node);
    return { FunctionDeclaration: listener, FunctionExpression: listener, ArrowFunctionExpression: listener };
  },
};
