import type { TSESTree } from '@typescript-eslint/utils';

export type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

export const FUNCTION_TYPES: ReadonlySet<string> = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** TS のアサーションは使用を隠さない。実質の使用ノードとその親まで潜る */
const ASSERTION_TYPES: ReadonlySet<string> = new Set([
  'TSNonNullExpression',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
  'TSInstantiationExpression',
]);

export function effectiveUse(node: TSESTree.Node): {
  use: TSESTree.Node;
  parent: TSESTree.Node | undefined;
} {
  const { parent } = node;
  const { type } = parent ?? { type: undefined };
  return parent !== undefined && type !== undefined && ASSERTION_TYPES.has(type)
    ? effectiveUse(parent)
    : { use: node, parent };
}

export function isMemberReceiver(parent: TSESTree.Node, id: TSESTree.Node): boolean {
  return parent.type === 'MemberExpression' && parent.object === id;
}

function callArgumentsOf(container: TSESTree.Node | undefined): readonly TSESTree.Node[] {
  const isCall = container?.type === 'CallExpression' || container?.type === 'NewExpression';
  return isCall ? ((container as TSESTree.CallExpression).arguments as TSESTree.Node[]) : [];
}

/** スプレッド (fn(...x)) は 1 段だけ潜り、呼び出しないし new の引数か判定する */
export function isCallArgument(parent: TSESTree.Node, id: TSESTree.Node): boolean {
  const viaSpread = parent.type === 'SpreadElement';
  const container = viaSpread ? parent.parent : parent;
  const argument: TSESTree.Node = viaSpread ? parent : id;
  return callArgumentsOf(container).includes(argument);
}

function parentOf(node: TSESTree.Node): TSESTree.Node | undefined {
  return node.parent;
}

function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return FUNCTION_TYPES.has(node.type);
}

/** ノードを包む関数ノードを内側から外側の順で集める */
export function enclosingFunctions(id: TSESTree.Node): FunctionNode[] {
  const chain: TSESTree.Node[] = [];
  for (let node = id.parent; node; node = parentOf(node)) {
    chain.push(node);
  }
  return chain.filter(isFunctionNode);
}

/** TSESTree は range を必ず持つため、範囲比較だけで包含を判定できる */
export function containsRange(outer: TSESTree.Node, inner: TSESTree.Node): boolean {
  const { range: outerRange } = outer;
  const { range: innerRange } = inner;
  return outerRange[0] <= innerRange[0] && innerRange[1] <= outerRange[1];
}

/** 候補のうち、内側に別の候補を含まない (最も内側の) ものだけを残す */
export function innermostOnly(candidates: readonly FunctionNode[]): FunctionNode[] {
  return candidates.filter(
    (fn) => !candidates.some((inner) => inner !== fn && containsRange(fn, inner)),
  );
}
