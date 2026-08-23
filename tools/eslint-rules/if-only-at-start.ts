import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { FUNCTION_TYPES, enclosingFunctions } from './ast-utils';

type MessageIds = 'notAtStart';

/** else if の連鎖は先頭の if の一部と見なす */
function chainedElse(node: TSESTree.IfStatement, parent: TSESTree.Node): boolean {
  return parent.type === 'IfStatement' && parent.alternate === node;
}

function asBlock(parent: TSESTree.Node): TSESTree.BlockStatement | undefined {
  return parent.type === 'BlockStatement' ? parent : undefined;
}

function functionBodyOf(parent: TSESTree.Node): readonly TSESTree.Statement[] | undefined {
  const block = asBlock(parent);
  const grandType = block?.parent.type ?? '';
  return FUNCTION_TYPES.has(grandType) ? block?.body : undefined;
}

/** 関数本体の先頭かつ唯一の文であるか */
function soleStatement(node: TSESTree.IfStatement, parent: TSESTree.Node): boolean {
  const body = functionBodyOf(parent) ?? [];
  return body[0] === node && body.length === 1;
}

/** 規律は関数の中の話。関数の外 (モジュールレベルや static ブロック) の if は対象外 */
function isCompliant(node: TSESTree.IfStatement): boolean {
  const { parent } = node;
  const insideFunction = enclosingFunctions(node).length > 0;
  return !insideFunction || chainedElse(node, parent) || soleStatement(node, parent);
}

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

function reportMisplaced(context: Context, node: TSESTree.IfStatement): void {
  const { loc } = node;
  const ifToken = context.sourceCode.getFirstToken(node);
  context.report({ loc: ifToken?.loc ?? loc, messageId: 'notAtStart' });
}

function flagViolation(context: Context, node: TSESTree.IfStatement): void {
  if (!isCompliant(node)) {
    reportMisplaced(context, node);
  }
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
        flagViolation(context, node);
      },
    };
  },
});
