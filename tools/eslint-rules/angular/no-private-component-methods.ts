import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { isAngularComponent } from '../support/angular-utils';

type MessageIds = 'noPrivateMethod';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

type Member = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

function enclosingClass(node: Member): TSESTree.ClassDeclaration | TSESTree.ClassExpression {
  return node.parent.parent as TSESTree.ClassDeclaration | TSESTree.ClassExpression;
}

function isHidden(node: Member): boolean {
  const { accessibility, key } = node;
  return accessibility === 'private' || key.type === 'PrivateIdentifier';
}

/** メソッド、またはメソッドとして振る舞う関数フィールド (アロー関数等) か */
function isMethodShaped(node: Member): boolean {
  const { value } = node;
  const fn = value?.type === 'ArrowFunctionExpression' || value?.type === 'FunctionExpression';
  return node.type === 'MethodDefinition' ? node.kind !== 'constructor' : fn;
}

function checkMember(context: Context, services: Services, node: Member): void {
  const hidden = isHidden(node) && isMethodShaped(node);
  condemn(context, node, hidden && isAngularComponent(services, enclosingClass(node)));
}

function condemn(context: Context, node: Member, violated: boolean): void {
  if (violated) {
    const { key } = node;
    context.report({ node: key, messageId: 'noPrivateMethod' });
  }
}

/**
 * コンポーネントは private メソッドを持たない (アロー関数フィールドも同様)。
 * ロジックはサービスや協力オブジェクトへ移し、コンポーネントはテンプレートと
 * 結線だけを持つ。対象は @angular/core の Component が付いたクラスだけ
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
    const services = ESLintUtils.getParserServices(context);
    const listener = (node: Member): void => checkMember(context, services, node);
    return { MethodDefinition: listener, PropertyDefinition: listener };
  },
});
