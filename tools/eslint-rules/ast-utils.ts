import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export type FunctionNode =
  TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

export function distinct<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

export function allScopes(sourceCode: TSESLint.SourceCode): TSESLint.Scope.Scope[] {
  const { scopeManager } = sourceCode;
  return scopeManager?.scopes ?? [];
}

export const FUNCTION_TYPES: ReadonlySet<string> = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** TS のアサーションは使用を隠さない。実質の使用ノードとその親まで潜る */
const ASSERTION_KINDS: ReadonlySet<string> = new Set([
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
  return parent !== undefined && type !== undefined && ASSERTION_KINDS.has(type)
    ? effectiveUse(parent)
    : { use: node, parent };
}

export function isReceiver(parent: TSESTree.Node, id: TSESTree.Node): boolean {
  return parent.type === 'MemberExpression' && parent.object === id;
}

function argumentsIn(container: TSESTree.Node | undefined): readonly TSESTree.Node[] {
  const isCall = container?.type === 'CallExpression' || container?.type === 'NewExpression';
  return isCall ? ((container as TSESTree.CallExpression).arguments as TSESTree.Node[]) : [];
}

/** スプレッド (fn(...x)) は 1 段だけ潜り、呼び出しないし new の引数か判定する */
export function isCallArgument(parent: TSESTree.Node, id: TSESTree.Node): boolean {
  const viaSpread = parent.type === 'SpreadElement';
  const container = viaSpread ? parent.parent : parent;
  const argument: TSESTree.Node = viaSpread ? parent : id;
  return argumentsIn(container).includes(argument);
}

function parentOf(node: TSESTree.Node): TSESTree.Node | undefined {
  return node.parent;
}

function isFn(node: TSESTree.Node): node is FunctionNode {
  return FUNCTION_TYPES.has(node.type);
}

/** ノードを包む関数ノードを内側から外側の順で集める */
export function enclosingFunctions(id: TSESTree.Node): FunctionNode[] {
  const chain: TSESTree.Node[] = [];
  for (let node = id.parent; node; node = parentOf(node)) {
    chain.push(node);
  }
  return chain.filter(isFn);
}

/** TSESTree は range を必ず持つため、範囲比較だけで包含を判定できる */
export function isWrapping(outer: TSESTree.Node, inner: TSESTree.Node): boolean {
  return outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];
}

/** 候補のうち、内側に別の候補を含まない (最も内側の) ものだけを残す */
export function innermostOnly(candidates: readonly FunctionNode[]): FunctionNode[] {
  return candidates.filter(
    (fn) => !candidates.some((inner) => inner !== fn && isWrapping(fn, inner)),
  );
}
