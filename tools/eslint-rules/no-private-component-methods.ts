import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'noPrivateMethod';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

function decoratorLabel(decorator: TSESTree.Decorator): string {
  const { expression } = decorator;
  const call = expression.type === 'CallExpression' ? expression : undefined;
  return call?.callee.type === 'Identifier' ? call.callee.name : '';
}

function isComponent(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): boolean {
  return node.decorators.some((decorator) => decoratorLabel(decorator) === 'Component');
}

function enclosingClass(
  node: TSESTree.MethodDefinition,
): TSESTree.ClassDeclaration | TSESTree.ClassExpression {
  return node.parent.parent as TSESTree.ClassDeclaration | TSESTree.ClassExpression;
}

function isHidden(node: TSESTree.MethodDefinition): boolean {
  const { accessibility, key, kind } = node;
  const shielded = accessibility === 'private' || key.type === 'PrivateIdentifier';
  return shielded && kind !== 'constructor';
}

function checkMethod(context: Context, node: TSESTree.MethodDefinition): void {
  const violated = isHidden(node) && isComponent(enclosingClass(node));
  condemn(context, node, violated);
}

function condemn(context: Context, node: TSESTree.MethodDefinition, violated: boolean): void {
  if (violated) {
    const { key } = node;
    context.report({ node: key, messageId: 'noPrivateMethod' });
  }
}

/**
 * コンポーネントは private メソッドを持たない。ロジックはサービスや
 * 協力オブジェクトへ移し、コンポーネントはテンプレートと結線だけを持つ
 */
export const noPrivateComponentMethods = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      noPrivateMethod:
        'コンポーネントに private メソッドを置かない。ロジックはサービスや協力オブジェクトへ移す',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return { MethodDefinition: (node) => checkMethod(context, node) };
  },
});
