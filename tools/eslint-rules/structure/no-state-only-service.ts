import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import type * as ts from 'typescript';
import { isDecorated, originOf, resolvedSymbol } from '../support/angular-utils';

type MessageIds = 'stateOnly' | 'globalState' | 'derivedState' | 'localMisplaced';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

/** 状態の保有と見なす初期化子。computed は導出であり状態ではない */
const OWNED: readonly string[] = ['signal', 'linkedSignal', 'resource'];

/** 操作を要求する初期化子。resource は自走するため操作を要さない */
const MUTABLE: readonly string[] = ['signal', 'linkedSignal'];

function propValue(member: TSESTree.ClassElement): TSESTree.Node | undefined {
  return member.type === 'PropertyDefinition' ? (member.value ?? undefined) : undefined;
}

function calledTarget(expression: TSESTree.Node | undefined): TSESTree.Node | undefined {
  return expression?.type === 'CallExpression' ? expression.callee : undefined;
}

function isCoreSource(symbol: ts.Symbol | undefined, names: readonly string[]): boolean {
  const { name } = symbol ?? { name: '' };
  return names.includes(name) && originOf(symbol).includes('@angular/core');
}

function isSourced(
  services: Services,
  expression: TSESTree.Node | undefined,
  names: readonly string[],
): boolean {
  const callee = calledTarget(expression);
  return callee !== undefined && isCoreSource(resolvedSymbol(services, callee), names);
}

function isStateful(
  services: Services,
  cls: TSESTree.ClassDeclaration,
  names: readonly string[],
): boolean {
  return cls.body.body.some((member) => isSourced(services, propValue(member), names));
}

/** 公開メソッド (操作) を 1 つでも持つか */
function isOperative(cls: TSESTree.ClassDeclaration): boolean {
  return cls.body.body.some(
    (m) => m.type === 'MethodDefinition' && m.kind === 'method' && m.accessibility !== 'private',
  );
}

/** true = @Service (グローバル)、false = @Injectable (ローカル)、undefined = 対象外 */
function classify(services: Services, cls: TSESTree.ClassDeclaration): boolean | undefined {
  const service = isDecorated(services, cls, 'Service');
  const local = !service && isDecorated(services, cls, 'Injectable');
  return service ? true : local ? false : undefined;
}

function isTitled(cls: TSESTree.ClassDeclaration): boolean {
  const { name } = cls.id ?? { name: '' };
  return name.endsWith('State');
}

function isColocated(filename: string): boolean {
  return filename.endsWith('.state.ts');
}

function isStrayed(titled: boolean, owning: boolean, filename: string): boolean {
  return (titled && !isColocated(filename)) || (owning && !titled);
}

function onGlobal(idle: boolean, titled: boolean): MessageIds | undefined {
  return titled ? 'globalState' : idle ? 'stateOnly' : undefined;
}

function onLocal(
  owning: boolean,
  idle: boolean,
  titled: boolean,
  filename: string,
): MessageIds | undefined {
  const posing = titled && !owning;
  const strayed = isStrayed(titled, owning, filename);
  return posing ? 'derivedState' : strayed ? 'localMisplaced' : idle ? 'stateOnly' : undefined;
}

function verdict(
  services: Services,
  cls: TSESTree.ClassDeclaration,
  filename: string,
  global: boolean,
): MessageIds | undefined {
  const owning = isStateful(services, cls, OWNED);
  const idle = isStateful(services, cls, MUTABLE) && !isOperative(cls);
  return global ? onGlobal(idle, isTitled(cls)) : onLocal(owning, idle, isTitled(cls), filename);
}

function audit(context: Context, services: Services, cls: TSESTree.ClassDeclaration): void {
  const { filename } = context;
  const global = classify(services, cls);
  const fault = global === undefined ? undefined : verdict(services, cls, filename, global);
  condemn(context, cls, fault);
}

function condemn(context: Context, node: TSESTree.Node, id: MessageIds | undefined): void {
  if (id !== undefined) {
    context.report({ node, messageId: id });
  }
}

/**
 * 責務単位の凝集を強制する。状態だけのサービス (操作のないミュータブル状態) と
 * グローバルな State クラスを禁じ、ローカルステート XxxState は状態を保有して
 * コンポーネント同居の *.state.ts に置く
 */
export const noStateOnlyService = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      stateOnly: '状態だけでサービス化しない。状態とそれを操作するロジックを同じ責務単位に置く',
      globalState: 'グローバルな State クラスを置かない。状態はドメインサービスが保有する',
      derivedState:
        '状態を保有しないクラスは State と名乗らない。導出はサービスかコンポーネントの computed に置く',
      localMisplaced:
        '状態を保有する @Injectable はコンポーネント同居の *.state.ts の XxxState に置く',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { ClassDeclaration: (node) => audit(context, services, node) };
  },
});
