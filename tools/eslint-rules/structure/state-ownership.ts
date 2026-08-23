import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import type * as ts from 'typescript';
import { isDecorated, originOf, resolvedSymbol } from '../support/angular-utils';

type MessageIds = 'derivedState' | 'globalMisplaced' | 'localMisplaced';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

/** writable な状態の源。computed は導出であり状態ではない */
const SOURCES: readonly string[] = ['signal', 'linkedSignal', 'resource'];

function propValue(member: TSESTree.ClassElement): TSESTree.Node | undefined {
  return member.type === 'PropertyDefinition' ? (member.value ?? undefined) : undefined;
}

function calledTarget(expression: TSESTree.Node | undefined): TSESTree.Node | undefined {
  return expression?.type === 'CallExpression' ? expression.callee : undefined;
}

function isCoreSource(symbol: ts.Symbol | undefined): boolean {
  const { name } = symbol ?? { name: '' };
  return SOURCES.includes(name) && originOf(symbol).includes('@angular/core');
}

function isWritableInit(services: Services, expression: TSESTree.Node | undefined): boolean {
  const callee = calledTarget(expression);
  return callee !== undefined && isCoreSource(resolvedSymbol(services, callee));
}

function isStateful(services: Services, cls: TSESTree.ClassDeclaration): boolean {
  return cls.body.body.some((member) => isWritableInit(services, propValue(member)));
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

function isInGlobalHome(filename: string): boolean {
  return /(^|[\\/])src[\\/]app[\\/]state[\\/][^\\/]+\.state\.ts$/.test(filename);
}

function isColocated(filename: string): boolean {
  return filename.endsWith('.state.ts');
}

function isAnchored(titled: boolean, filename: string): boolean {
  return titled && isInGlobalHome(filename);
}

/** グローバル (@Service): 状態を保有するなら state/ の *.state.ts に置く */
function onGlobal(owning: boolean, titled: boolean, filename: string): MessageIds | undefined {
  const strayed = owning && !isAnchored(titled, filename);
  return strayed ? 'globalMisplaced' : undefined;
}

/** ローカル (@Injectable): XxxState はコンポーネント同居の *.state.ts に置く */
function onLocal(owning: boolean, titled: boolean, filename: string): MessageIds | undefined {
  const adrift = titled && !isColocated(filename);
  const nameless = owning && !titled;
  return adrift || nameless ? 'localMisplaced' : undefined;
}

function placed(
  global: boolean,
  owning: boolean,
  filename: string,
  titled: boolean,
): MessageIds | undefined {
  return global ? onGlobal(owning, titled, filename) : onLocal(owning, titled, filename);
}

function faultOf(
  global: boolean,
  owning: boolean,
  filename: string,
  titled: boolean,
): MessageIds | undefined {
  const posing = titled && !owning;
  return posing ? 'derivedState' : placed(global, owning, filename, titled);
}

function verdict(
  services: Services,
  cls: TSESTree.ClassDeclaration,
  filename: string,
  global: boolean,
): MessageIds | undefined {
  return faultOf(global, isStateful(services, cls), filename, isTitled(cls));
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
 * 状態クラスの資格と置き場を強制する。グローバル (@Service) の State は
 * writable な状態 (signal / linkedSignal / resource) を保有し state/ の *.state.ts に
 * 置く。ローカル (@Injectable) の XxxState はコンポーネント同居の *.state.ts に置く
 */
export const stateOwnership = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      derivedState:
        '状態を保有しないクラスは State と名乗らない。導出はグローバルステートの computed かコンポーネントの computed に置く',
      globalMisplaced:
        '状態を保有する @Service は src/app/state/ の *.state.ts に XxxState として置く',
      localMisplaced:
        '状態を保有する @Injectable はコンポーネント同居の *.state.ts に XxxState として置く',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { ClassDeclaration: (node) => audit(context, services, node) };
  },
});
