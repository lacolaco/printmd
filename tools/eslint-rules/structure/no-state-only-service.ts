import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { fromCore, isDecorated } from '../support/angular-utils';

type MessageIds = 'stateOnly' | 'globalState' | 'vmShape';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

/** 操作を要求する初期化子。resource は自走するため操作を要さない */
const MUTABLE: readonly string[] = ['signal', 'linkedSignal'];

function propValue(member: TSESTree.ClassElement): TSESTree.Node | undefined {
  return member.type === 'PropertyDefinition' ? (member.value ?? undefined) : undefined;
}

/** プロパティ初期化子のうち @angular/core の呼び出しであるものの名前一覧 */
function reactives(services: Services, cls: TSESTree.ClassDeclaration): readonly string[] {
  const values = cls.body.body.map((member) => propValue(member));
  const names = values.map((v) => (v === undefined ? undefined : fromCore(services, v)));
  return names.filter((name): name is string => name !== undefined);
}

/** 公開メソッド (操作) を 1 つでも持つか */
function isOperative(cls: TSESTree.ClassDeclaration): boolean {
  return cls.body.body.some(
    (m) => m.type === 'MethodDefinition' && m.kind === 'method' && m.accessibility !== 'private',
  );
}

function isProvidedIn(decorator: TSESTree.Decorator): boolean {
  const call = decorator.expression.type === 'CallExpression' ? decorator.expression : undefined;
  const arg = call?.arguments[0];
  const props = arg?.type === 'ObjectExpression' ? arg.properties : [];
  return props.some(
    (p) => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === 'providedIn',
  );
}

/** @Injectable({providedIn}) はローカル提供ではなくグローバル */
function isRooted(cls: TSESTree.ClassDeclaration): boolean {
  return cls.decorators.some((decorator) => isProvidedIn(decorator));
}

function scoped(service: boolean, local: boolean, rooted: boolean): boolean | undefined {
  return service || (local && rooted) ? true : local ? false : undefined;
}

/** true = グローバル (@Service / providedIn 付き @Injectable)、false = ローカル、undefined = 対象外 */
function classify(services: Services, cls: TSESTree.ClassDeclaration): boolean | undefined {
  const service = isDecorated(services, cls, 'Service');
  const local = !service && isDecorated(services, cls, 'Injectable');
  return scoped(service, local, isRooted(cls));
}

function isTitled(cls: TSESTree.ClassDeclaration): boolean {
  const { name } = cls.id ?? { name: '' };
  return name.endsWith('State');
}

/** ローカル (@Injectable) はビューモデル: XxxViewModel を *.vm.ts に置く */
function isShapedVm(cls: TSESTree.ClassDeclaration, filename: string): boolean {
  const { name } = cls.id ?? { name: '' };
  return name.endsWith('ViewModel') && filename.endsWith('.vm.ts');
}

function onGlobal(idle: boolean, titled: boolean): MessageIds | undefined {
  return titled ? 'globalState' : idle ? 'stateOnly' : undefined;
}

function verdict(
  services: Services,
  cls: TSESTree.ClassDeclaration,
  filename: string,
  global: boolean,
): MessageIds | undefined {
  const found = reactives(services, cls);
  const idle = found.some((name) => MUTABLE.includes(name)) && !isOperative(cls);
  return global ? onGlobal(idle, isTitled(cls)) : isShapedVm(cls, filename) ? undefined : 'vmShape';
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
 * グローバルな State クラスを禁じ、コンポーネント提供の @Injectable は
 * 1-1 対応するビューモデル XxxViewModel として *.vm.ts に置く
 */
export const noStateOnlyService = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      stateOnly: '状態だけでサービス化しない。状態とそれを操作するロジックを同じ責務単位に置く',
      globalState: 'グローバルな State クラスを置かない。状態はドメインサービスが保有する',
      vmShape: 'コンポーネント提供の @Injectable は、対応する XxxViewModel として *.vm.ts に置く',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { ClassDeclaration: (node) => audit(context, services, node) };
  },
});
