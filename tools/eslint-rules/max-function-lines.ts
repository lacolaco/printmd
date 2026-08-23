import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { maxLinesOption } from './options';

type MessageIds = 'tooLong';
type Options = [{ maxLines?: number }?];

const LINE_LIMIT = 5;

/** ロジックの無い行 (空行、および { } ( ) [ ] ; , だけの行) は数えない */
const PUNCTUATION_ONLY = /^[{}()[\];,]*$/;

function logicCount(sourceCode: TSESLint.SourceCode, body: TSESTree.Node): number {
  const lines = sourceCode.getText(body).split('\n');
  return lines.filter((line) => !PUNCTUATION_ONLY.test(line.trim())).length;
}

type FunctionNode =
  TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

type Context = TSESLint.RuleContext<MessageIds, Options>;

function reportIfTooLong(
  context: Context,
  maxLines: number,
  node: FunctionNode,
  lines: number,
): void {
  if (lines > maxLines) {
    context.report({
      node,
      messageId: 'tooLong',
      data: { lines: String(lines), max: String(maxLines) },
    });
  }
}

function makeListener(context: Context, maxLines: number, sourceCode: TSESLint.SourceCode) {
  return (node: FunctionNode): void => {
    const { body } = node;
    reportIfTooLong(context, maxLines, node, logicCount(sourceCode, body));
  };
}

function visitorFor(listener: (node: FunctionNode) => void): TSESLint.RuleListener {
  return {
    FunctionDeclaration: listener,
    FunctionExpression: listener,
    ArrowFunctionExpression: listener,
  } as TSESLint.RuleListener;
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
    const { sourceCode } = context;
    const maxLines = maxLinesOption(context, LINE_LIMIT);
    return visitorFor(makeListener(context, maxLines, sourceCode));
  },
});
