import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'impureCondition';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

/** 呼び出しが状態を変える (コマンドである) ことが名前から確定するメソッド */
const MUTATING_METHODS: ReadonlySet<string> = new Set([
  'pop',
  'push',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
  'add',
  'delete',
  'clear',
  'set',
  'next',
  'exec',
]);

/** 呼ぶたびに結果が変わる (純粋な問い合わせでない) 呼び出し */
const NONDETERMINISTIC_CALLEES: ReadonlySet<string> = new Set([
  'Date.now',
  'Math.random',
  'performance.now',
]);

/** 条件を持つノード種別。いずれも test プロパティが条件式 */
const CONDITION_NODE_TYPES = [
  'IfStatement',
  'ConditionalExpression',
  'WhileStatement',
  'DoWhileStatement',
  'ForStatement',
] as const;

function propertyName(callee: TSESTree.Node): string {
  const property = callee.type === 'MemberExpression' ? callee.property : undefined;
  return property?.type === 'Identifier' ? property.name : '';
}

function calleePath(callee: TSESTree.Node): string {
  const named = callee.type === 'MemberExpression' ? callee : undefined;
  const object = named?.object.type === 'Identifier' ? named.object.name : '';
  const property = named?.property.type === 'Identifier' ? named.property.name : '';
  return `${object}.${property}`;
}

function impureCallee(callee: TSESTree.Node): boolean {
  return (
    MUTATING_METHODS.has(propertyName(callee)) || NONDETERMINISTIC_CALLEES.has(calleePath(callee))
  );
}

function isImpureNode(node: TSESTree.Node): boolean {
  const impureKind =
    node.type === 'AssignmentExpression' ||
    node.type === 'UpdateExpression' ||
    (node.type === 'UnaryExpression' && node.operator === 'delete');
  return impureKind || (node.type === 'CallExpression' && impureCallee(node.callee));
}

function nodeLike(value: unknown): value is TSESTree.Node {
  const type = (value as { type?: unknown } | null)?.type;
  return typeof value === 'object' && value !== null && typeof type === 'string';
}

/** parent は遡行になるため辿らない。loc / range はノードではないので落ちる */
function childNodesOf(node: TSESTree.Node): TSESTree.Node[] {
  const entries = Object.entries(node).filter(([key]) => key !== 'parent');
  const values = entries.flatMap(([, value]) => (Array.isArray(value) ? value : [value]));
  return values.filter(nodeLike);
}

/** 条件式の部分木 (コールバックの中身を含む) から不純な操作を集める */
function collectImpure(node: TSESTree.Node): TSESTree.Node[] {
  const own = isImpureNode(node) ? [node] : [];
  const children = childNodesOf(node);
  return [...own, ...children.flatMap(collectImpure)];
}

function auditTest(context: Context, test: TSESTree.Node | null): void {
  const targets = test === null ? [] : collectImpure(test);
  targets.forEach((node) => context.report({ loc: node.loc, messageId: 'impureCondition' }));
}

function makeVisitor(check: (test: TSESTree.Node | null) => void): TSESLint.RuleListener {
  const listener = (node: { test: TSESTree.Node | null }): void => check(node.test);
  return Object.fromEntries(CONDITION_NODE_TYPES.map((type) => [type, listener]));
}

/**
 * 純粋な条件式: 条件には副作用の無い問い合わせだけを使う (コマンド問い合わせ分離)。
 * 変更系メソッド・代入・インクリメント・非決定的呼び出しを条件位置で禁止する
 */
export const pureConditions = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      impureCondition:
        '条件式に副作用のある操作を置かない。先に実行して結果を束縛するか、問い合わせに分離する (純粋な条件式)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return makeVisitor((test) => auditTest(context, test));
  },
});
