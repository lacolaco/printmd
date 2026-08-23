import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'noDefault' | 'caseMustReturn';

function isReturning(statements: readonly TSESTree.Statement[]): boolean {
  const last = statements[statements.length - 1];
  const lastOfBlock = last?.type === 'BlockStatement' ? last.body[last.body.length - 1] : last;
  return lastOfBlock?.type === 'ReturnStatement';
}

/** fallthrough でまとめた空 case は、末尾でなければ許す */
function isTolerable(switchCase: TSESTree.SwitchCase, isLast: boolean): boolean {
  const { consequent } = switchCase;
  const { length } = consequent;
  return (length === 0 && !isLast) || isReturning(consequent);
}

function caseFinding(
  switchCase: TSESTree.SwitchCase,
  isLast: boolean,
): { node: TSESTree.SwitchCase; messageId: MessageIds } | null {
  const { test } = switchCase;
  const messageId = test === null ? 'noDefault' : 'caseMustReturn';
  const compliant = test !== null && isTolerable(switchCase, isLast);
  return compliant ? null : { node: switchCase, messageId };
}

function findingsIn(
  node: TSESTree.SwitchStatement,
): { node: TSESTree.SwitchCase; messageId: MessageIds }[] {
  const { cases } = node;
  const { length } = cases;
  return cases.flatMap((switchCase, index) => caseFinding(switchCase, index === length - 1) ?? []);
}

/**
 * switch は原則使わない。使う場合は default を持たず、全 case が return し、
 * 網羅性は型検査 (switch-exhaustiveness-check と noImplicitReturns) が保証する形に限る
 */
export const noSwitch = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      noDefault:
        'switch に default を書かない。網羅性は型で保証し、漏れはコンパイルエラーにする (switch は使わない)',
      caseMustReturn: 'switch の case は必ず return で終える (switch は使わない)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      SwitchStatement(node) {
        findingsIn(node).forEach((finding) => context.report(finding));
      },
    };
  },
});
