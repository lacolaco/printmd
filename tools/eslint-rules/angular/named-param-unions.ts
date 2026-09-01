import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { enclosingClass, isDecorated } from '../support/angular-utils';

type MessageIds = 'namedUnion';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];
type Services = ReturnType<typeof ESLintUtils.getParserServices>;
type Member =
  | TSESTree.MethodDefinition
  | TSESTree.PropertyDefinition
  | TSESTree.TSAbstractMethodDefinition
  | TSESTree.TSAbstractPropertyDefinition;

/** 省略や欠損を表すだけの型。union に混ざっても意味のある選択肢を増やさない */
const ABSENCE: readonly string[] = ['TSUndefinedKeyword', 'TSNullKeyword', 'TSVoidKeyword'];

/** 公開でない印。これらのメンバーは呼ぶ側から見えないので対象外 */
const HIDDEN: readonly string[] = ['private', 'protected'];

/** 見る節。abstract のメンバーも同じ扱いにする */
const MEMBERS: readonly string[] = [
  'MethodDefinition',
  'PropertyDefinition',
  'TSAbstractMethodDefinition',
  'TSAbstractPropertyDefinition',
];

/** 辿らない辺。parent は循環し、body は署名ではなく実装の中身である */
const SKIPPED: readonly string[] = ['parent', 'body'];

function isViewModel(cls: TSESTree.ClassDeclaration | TSESTree.ClassExpression): boolean {
  return (cls.id?.name ?? '').endsWith('ViewModel');
}

function isTarget(
  services: Services,
  cls: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): boolean {
  const service = isDecorated(services, cls, 'Service') || isDecorated(services, cls, 'Injectable');
  return isViewModel(cls) || service;
}

function isExempt(services: Services, member: Member): boolean {
  const { accessibility, key } = member;
  const hidden = HIDDEN.includes(accessibility ?? '') || key.type === 'PrivateIdentifier';
  return hidden || !isTarget(services, enclosingClass(member));
}

function isNode(value: unknown): value is TSESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value;
}

/** private なコンストラクタ引数プロパティ。メンバーと同じく呼ぶ側から見えない */
function isConcealed(node: TSESTree.Node): boolean {
  const declared = node.type === 'TSParameterProperty' ? node : undefined;
  return HIDDEN.includes(declared?.accessibility ?? '');
}

/** 署名の中の節すべて。実装の中身と、隠れた引数プロパティへは入らない */
function signature(node: TSESTree.Node): readonly TSESTree.Node[] {
  const pairs = Object.entries(node).filter(([key]) => !SKIPPED.includes(key));
  const values = pairs.flatMap(([, value]) => (Array.isArray(value) ? value : [value]));
  const kids = values.filter(isNode).filter((child) => !isConcealed(child));
  return [node, ...kids.flatMap(signature)];
}

/** union を平らにした葉。入れ子の括弧で割られた選択肢も 1 つずつ数える */
function leaves(node: TSESTree.Node): readonly TSESTree.Node[] {
  const union = node.type === 'TSUnionType' ? node : undefined;
  return union === undefined ? [node] : union.types.flatMap(leaves);
}

/** true と false の組は boolean という名前を既に持つので、切り出す先が無い */
function isBoolean(node: TSESTree.Node): boolean {
  const literal = node.type === 'TSLiteralType' ? node.literal : undefined;
  return literal?.type === 'Literal' && typeof literal.value === 'boolean';
}

/** 意味のある選択肢を 2 つ以上持つ union か */
function isMultiple(node: TSESTree.Node): boolean {
  const { type } = node;
  const parts = type === 'TSUnionType' ? leaves(node) : [];
  const choices = parts.filter((leaf) => !ABSENCE.includes(leaf.type));
  return choices.length > 1 && !choices.every(isBoolean);
}

/** 外側の union が既に咎められるので、その内側は報告しない */
function isNested(node: TSESTree.Node): boolean {
  return node.parent?.type === 'TSUnionType';
}

function audit(context: Context, services: Services, member: Member): void {
  const scanned = isExempt(services, member) ? [] : signature(member);
  const found = scanned.filter(isMultiple).filter((node) => !isNested(node));
  found.forEach((node) => context.report({ node, messageId: 'namedUnion' }));
}

/**
 * ビューモデルとサービスの公開メンバーの署名に、インラインの union を書かせない。
 * 選択肢の集合は名前付きの型に切り出す。呼ぶ側と実装が同じ名前を見て話せるようになり、
 * 選択肢を増やすときに書き換える場所が 1 つで済む
 */
export const namedParamUnions = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      namedUnion:
        'ビューモデルとサービスの公開メンバーの署名に、インラインの union を書くな。名前付きの型に切り出せ',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const on = (node: Member) => audit(context, services, node);
    return Object.fromEntries(MEMBERS.map((name) => [name, on]));
  },
});
