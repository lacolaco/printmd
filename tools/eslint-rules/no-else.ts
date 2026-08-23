import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'noElse';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

/** disable コメントを if の直前行に置けるよう、報告は if キーワードに出す */
function flagAlternate(context: Context, node: TSESTree.IfStatement): void {
  const { loc } = node;
  const ifToken = context.sourceCode.getFirstToken(node);
  context.report({ loc: ifToken?.loc ?? loc, messageId: 'noElse' });
}

function auditBranch(
  context: Context,
  node: TSESTree.IfStatement,
  alternate: TSESTree.Statement | null,
): void {
  if (alternate !== null) {
    flagAlternate(context, node);
  }
}

/**
 * if で else は使わない: 分岐は早期 return・条件演算子・多態で表す。
 * 外部データ型のチェックだけは eslint-disable コメントで理由を明記して除外する
 */
export const noElse = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      noElse:
        'if と else を一緒に使わない。早期 return・条件演算子・多態で表す (外部データ型のチェックは eslint-disable コメントで理由を明記して除外する)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      IfStatement(node) {
        const { alternate } = node;
        auditBranch(context, node, alternate);
      },
    };
  },
});
