import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'notAtStart';

const FUNCTION_TYPES: ReadonlySet<string> = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** else if の連鎖は先頭の if の一部と見なす */
function isElseIfChain(node: TSESTree.IfStatement, parent: TSESTree.Node): boolean {
  return parent.type === 'IfStatement' && parent.alternate === node;
}

function functionBodyOf(parent: TSESTree.Node): readonly TSESTree.Statement[] | undefined {
  const block = parent.type === 'BlockStatement' ? parent : undefined;
  const grandType = block?.parent.type ?? '';
  return FUNCTION_TYPES.has(grandType) ? block?.body : undefined;
}

/** 関数本体の先頭かつ唯一の文であるか */
function isOnlyStatementOfFunction(node: TSESTree.IfStatement, parent: TSESTree.Node): boolean {
  const body = functionBodyOf(parent) ?? [];
  return body[0] === node && body.length === 1;
}

function isCompliant(node: TSESTree.IfStatement): boolean {
  const { parent } = node;
  const compliant =
    isElseIfChain(node, parent) || isOnlyStatementOfFunction(node, parent);
  return compliant;
}

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

function reportMisplacedIf(context: Context, node: TSESTree.IfStatement): void {
  const { loc } = node;
  const ifToken = context.sourceCode.getFirstToken(node);
  context.report({ loc: ifToken?.loc ?? loc, messageId: 'notAtStart' });
}

function reportUnlessCompliant(context: Context, node: TSESTree.IfStatement): void {
  if (!isCompliant(node)) reportMisplacedIf(context, node);
}

/**
 * if は最初だけ: if 文は関数本体の先頭に置き、その関数は他のことをしない。
 * if が別の場所に要るなら、if を唯一の文とする関数へ抽出する
 */
export const ifOnlyAtStart = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      notAtStart:
        'if 文は関数の最初に置き、その関数は他のことをしない。if を唯一の文とする関数へ抽出する (if は最初だけ)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      IfStatement(node) {
        reportUnlessCompliant(context, node);
      },
    };
  },
});
