import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { fromCore, isAngularComponent, originOf, resolvedSymbol } from '../support/angular-utils';

type MessageIds = 'foreignInject' | 'mixedRole';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

/** input/output 駆動 (プレーン) の印 */
const IO: readonly string[] = ['input', 'output', 'model'];

function propCall(member: TSESTree.ClassElement): TSESTree.CallExpression | undefined {
  const value = member.type === 'PropertyDefinition' ? member.value : null;
  return value?.type === 'CallExpression' ? value : undefined;
}

function injectedToken(
  services: Services,
  member: TSESTree.ClassElement,
): TSESTree.Node | undefined {
  const call = propCall(member);
  const target = call === undefined ? undefined : fromCore(services, call);
  const { arguments: args } = call ?? { arguments: [] as TSESTree.CallExpressionArgument[] };
  return target === 'inject' ? args[0] : undefined;
}

function isIo(services: Services, member: TSESTree.ClassElement): boolean {
  const call = propCall(member);
  return call !== undefined && IO.includes(fromCore(services, call) ?? '');
}

/** プロジェクト定義のトークンで、自身の XxxViewModel でもないものか */
function isForeign(services: Services, target: TSESTree.Node, owner: string): boolean {
  const symbol = resolvedSymbol(services, target);
  const { name } = symbol ?? { name: '' };
  const origin = originOf(symbol);
  return origin !== '' && !origin.includes('node_modules') && name !== `${owner}ViewModel`;
}

function isModelInject(services: Services, member: TSESTree.ClassElement): boolean {
  const target = injectedToken(services, member);
  const symbol = target === undefined ? undefined : resolvedSymbol(services, target);
  const { name } = symbol ?? { name: '' };
  return name.endsWith('ViewModel');
}

function ownerName(cls: TSESTree.ClassDeclaration): string {
  const { id } = cls;
  return id?.name ?? '';
}

function vet(context: Context, services: Services, member: TSESTree.ClassElement, owner: string) {
  const target = injectedToken(services, member);
  const foreign = target !== undefined && isForeign(services, target, owner);
  condemn(context, member, foreign ? 'foreignInject' : undefined);
}

function isMixed(services: Services, members: readonly TSESTree.ClassElement[]): boolean {
  return members.some((m) => isIo(services, m)) && members.some((m) => isModelInject(services, m));
}

function vetAll(
  context: Context,
  services: Services,
  members: readonly TSESTree.ClassElement[],
  owner: string,
): void {
  members.forEach((member) => vet(context, services, member, owner));
}

function audit(context: Context, services: Services, cls: TSESTree.ClassDeclaration): void {
  const { body } = cls;
  const members = isAngularComponent(services, cls) ? body.body : [];
  vetAll(context, services, members, ownerName(cls));
  condemn(context, cls, isMixed(services, members) ? 'mixedRole' : undefined);
}

function condemn(context: Context, node: TSESTree.Node, id: MessageIds | undefined): void {
  if (id !== undefined) {
    context.report({ node, messageId: id });
  }
}

/**
 * コンポーネントの注入面を 1-1 のビューモデルに限る。ElementRef など
 * フレームワーク基盤は例外。input/output 駆動のプレーンなコンポーネントは
 * ビューモデルを持たない
 */
export const vmBoundary = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      foreignInject:
        'コンポーネントが注入してよいのは自身と 1-1 対応する XxxViewModel だけ (フレームワーク基盤は除く)',
      mixedRole: 'input/output を使うコンポーネントはビューモデルを持たない (プレーンに徹する)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { ClassDeclaration: (node) => audit(context, services, node) };
  },
});
