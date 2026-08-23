import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'noPrivateMethod';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Member = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

function decoratorLabel(decorator: TSESTree.Decorator): string {
  const { expression } = decorator;
  const call = expression.type === 'CallExpression' ? expression : undefined;
  return call?.callee.type === 'Identifier' ? call.callee.name : '';
}

function isComponent(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): boolean {
  return node.decorators.some((decorator) => decoratorLabel(decorator) === 'Component');
}

function textOf(name: TSESTree.Identifier | TSESTree.StringLiteral): string {
  return name.type === 'Identifier' ? name.name : name.value;
}

function importedName(specifier: TSESTree.ImportClause): string {
  const named = specifier.type === 'ImportSpecifier' ? specifier.imported : undefined;
  return named === undefined ? '' : textOf(named);
}

/** @angular/core から Component を import している文か */
function isCoreImport(statement: TSESTree.ProgramStatement): boolean {
  const imp =
    statement.type === 'ImportDeclaration' && statement.source.value === '@angular/core'
      ? statement
      : undefined;
  return (imp?.specifiers ?? []).some((specifier) => importedName(specifier) === 'Component');
}

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

function checkMember(context: Context, angular: boolean, node: Member): void {
  const hidden = angular && isHidden(node) && isMethodShaped(node);
  condemn(context, node, hidden && isComponent(enclosingClass(node)));
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
    const { sourceCode } = context;
    const angular = sourceCode.ast.body.some((statement) => isCoreImport(statement));
    const listener = (node: Member): void => checkMember(context, angular, node);
    return { MethodDefinition: listener, PropertyDefinition: listener };
  },
});
