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

function isWellPlaced(global: boolean, filename: string): boolean {
  return global ? isInGlobalHome(filename) : isColocated(filename);
}

function strayed(global: boolean, filename: string, titled: boolean): MessageIds | undefined {
  const settled = titled && isWellPlaced(global, filename);
  return settled ? undefined : global ? 'globalMisplaced' : 'localMisplaced';
}

function faultOf(
  global: boolean,
  owning: boolean,
  filename: string,
  titled: boolean,
): MessageIds | undefined {
  const posing = titled && !owning;
  return posing ? 'derivedState' : owning ? strayed(global, filename, titled) : undefined;
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
 * 状態クラスの資格と置き場を強制する。State と名乗れるのは writable な状態
 * (signal / linkedSignal / resource) を保有するクラスだけで、@Service なら
 * src/app/state/ の *.state.ts、@Injectable ならコンポーネント同居の *.state.ts に置く
 */
export const stateOwnership = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      derivedState:
        '状態を保有しないクラスは State と名乗らない。導出だけなら導出サービスかコンポーネントの computed にする',
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
