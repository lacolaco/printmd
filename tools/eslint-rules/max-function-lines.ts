import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { maxLinesOption } from './options';

type MessageIds = 'tooLong';
type Options = [{ maxLines?: number }?];

const DEFAULT_MAX_LINES = 5;

/** ロジックの無い行 (空行、および { } ( ) [ ] ; , だけの行) は数えない */
const PUNCTUATION_ONLY = /^[{}()[\];,]*$/;

function countLogicLines(sourceCode: TSESLint.SourceCode, body: TSESTree.Node): number {
  const lines = sourceCode.getText(body).split('\n');
  return lines.filter((line) => !PUNCTUATION_ONLY.test(line.trim())).length;
}

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

function check(
  context: TSESLint.RuleContext<MessageIds, Options>,
  maxLines: number,
  node: FunctionNode,
): void {
  const lines = countLogicLines(context.sourceCode, node.body);
  if (lines > maxLines) {
    context.report({ node, messageId: 'tooLong', data: { lines: String(lines), max: String(maxLines) } });
  }
}

/** 5 行ルール: 関数・メソッドの本体はロジックのある行が maxLines 行以内 (既定 5) */
export const maxFunctionLines = ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
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
  defaultOptions: [{}],
  create(context) {
    const maxLines = maxLinesOption(context, DEFAULT_MAX_LINES);
    const listener = (node: FunctionNode) => check(context, maxLines, node);
    return { FunctionDeclaration: listener, FunctionExpression: listener, ArrowFunctionExpression: listener };
  },
});
