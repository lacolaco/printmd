import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'noExtends';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type ClassNode = TSESTree.ClassDeclaration | TSESTree.ClassExpression;

function reportExtends(context: Context, superClass: TSESTree.Node): void {
  const { loc } = superClass;
  context.report({ loc, messageId: 'noExtends' });
}

function reportIfExtends(context: Context, superClass: TSESTree.Node | null): void {
  if (superClass !== null) {
    reportExtends(context, superClass);
  }
}

/** 継承はインタフェースだけからする。クラス (抽象クラス含む) の extends を禁止する */
export const noClassInheritance = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      noExtends:
        'クラスからの継承は禁止。継承はインタフェースだけからにし、実装の共有は移譲で表す (継承はインタフェースだけ)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const listener = (node: ClassNode): void => {
      const { superClass } = node;
      reportIfExtends(context, superClass);
    };
    return { ClassDeclaration: listener, ClassExpression: listener };
  },
});
