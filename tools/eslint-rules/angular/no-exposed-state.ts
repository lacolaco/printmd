import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { enclosingClass, isDecorated, originOf, resolvedSymbol } from '../support/angular-utils';

type MessageIds = 'exposedState';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

function isHidden(member: TSESTree.PropertyDefinition): boolean {
  return member.accessibility === 'private' || member.key.type === 'PrivateIdentifier';
}

function isCoreInject(services: Services, callee: TSESTree.Node): boolean {
  const symbol = resolvedSymbol(services, callee);
  const { name } = symbol ?? { name: '' };
  return name === 'inject' && originOf(symbol).includes('@angular/core');
}

function argName(args: readonly TSESTree.CallExpressionArgument[]): string | undefined {
  const [target] = args;
  return target?.type === 'Identifier' ? target.name : undefined;
}

const IDLE = { callee: undefined, arguments: [] as TSESTree.CallExpressionArgument[] };

/** inject(X) 形の初期化子から注入トークン名を得る */
function injection(services: Services, member: TSESTree.PropertyDefinition): string | undefined {
  const { value } = member;
  const { callee, arguments: args } = value?.type === 'CallExpression' ? value : IDLE;
  return callee !== undefined && isCoreInject(services, callee) ? argName(args) : undefined;
}

function importedFrom(name: string, program: TSESTree.Program): string | undefined {
  const imports = program.body.filter((s) => s.type === 'ImportDeclaration');
  const owner = imports.find((d) => d.specifiers.some((sp) => sp.local.name === name));
  return owner === undefined ? undefined : String(owner.source.value);
}

/** state/ ディレクトリ配下の *.state モジュール = グローバルステート */
function isGlobalPath(path: string | undefined): boolean {
  return path !== undefined && /(^|\/)state\/[^/]+\.state$/.test(path);
}

function audit(context: Context, services: Services, member: TSESTree.PropertyDefinition): void {
  const { sourceCode } = context;
  const name = isHidden(member) ? undefined : injection(services, member);
  const path = name === undefined ? undefined : importedFrom(name, sourceCode.ast);
  const banned = isGlobalPath(path) && isDecorated(services, enclosingClass(member), 'Component');
  condemn(context, member, banned);
}

function condemn(context: Context, node: TSESTree.Node, violated: boolean): void {
  if (violated) {
    context.report({ node, messageId: 'exposedState' });
  }
}

/**
 * コンポーネントにグローバルステートを露出させない。注入フィールドは private に
 * 限り、テンプレートはコンポーネント自身の computed だけを参照する
 */
export const noExposedState = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      exposedState:
        'グローバルステートの注入フィールドは private にする。テンプレートへはコンポーネント自身の computed で渡す',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { PropertyDefinition: (node) => audit(context, services, node) };
  },
});
