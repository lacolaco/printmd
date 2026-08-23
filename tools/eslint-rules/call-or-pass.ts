import { getFunctionHeadLocation } from '@eslint-community/eslint-utils';
import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

type MessageIds = 'both';
type Finding = TSESLint.ReportDescriptor<MessageIds>;

interface Usage {
  member: TSESTree.Node[];
  passed: TSESTree.Node[];
}

const FUNCTION_TYPES: ReadonlySet<string> = new Set([
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

function effectiveUse(node: TSESTree.Node): {
  use: TSESTree.Node;
  parent: TSESTree.Node | undefined;
} {
  const { parent } = node;
  if (parent === undefined) return { use: node, parent };
  const { type } = parent;
  return ASSERTION_TYPES.has(type) ? effectiveUse(parent) : { use: node, parent };
}

function isMemberReceiver(parent: TSESTree.Node, id: TSESTree.Node): boolean {
  return parent.type === 'MemberExpression' && parent.object === id;
}

/** スプレッド (fn(...x)) は 1 段だけ潜り、呼び出しないし new の引数か判定する */
function isCallArgument(parent: TSESTree.Node, id: TSESTree.Node): boolean {
  const viaSpread = parent.type === 'SpreadElement';
  const container = viaSpread ? parent.parent : parent;
  const argument: TSESTree.Node = viaSpread ? parent : id;
  if (container?.type !== 'CallExpression' && container?.type !== 'NewExpression') return false;
  return (container.arguments as TSESTree.Node[]).includes(argument);
}

function classify(id: TSESTree.Node): keyof Usage | null {
  const { use, parent } = effectiveUse(id);
  if (parent === undefined) return null;
  if (isMemberReceiver(parent, use)) return 'member';
  return isCallArgument(parent, use) ? 'passed' : null;
}

const TARGET_DEF_TYPES: ReadonlySet<string> = new Set(['Parameter', 'Variable', 'CatchClause']);

/** 対象は関数内で宣言された引数・ローカル変数・catch 変数 (モジュールスコープは除く) */
function isTargetVariable(variable: TSESLint.Scope.Variable): boolean {
  const def = variable.defs[0];
  if (def === undefined || !TARGET_DEF_TYPES.has(def.type)) return false;
  return variable.scope.variableScope.type === 'function';
}

function markUsage(usage: Usage, id: TSESTree.Node): void {
  const kind = classify(id);
  if (kind !== null) usage[kind].push(id);
}

function collectUsage(variable: TSESLint.Scope.Variable): Usage {
  const usage: Usage = { member: [], passed: [] };
  for (const reference of variable.references) {
    markUsage(usage, reference.identifier);
  }
  return usage;
}

function appendIfFunction(chain: FunctionNode[], node: TSESTree.Node): void {
  const { type } = node;
  if (FUNCTION_TYPES.has(type)) chain.push(node as FunctionNode);
}

function parentOf(node: TSESTree.Node): TSESTree.Node | undefined {
  return node.parent;
}

/** ノードを包む関数ノードを内側から外側の順で集める */
function enclosingFunctions(id: TSESTree.Node): FunctionNode[] {
  const chain: FunctionNode[] = [];
  for (let node = id.parent; node; node = parentOf(node)) {
    appendIfFunction(chain, node);
  }
  return chain;
}

/** range が無いノードは包含と見なさない (既定値で相互包含になると報告が消える) */
function containsRange(outer: TSESTree.Node, inner: TSESTree.Node): boolean {
  const { range: outerRange } = outer;
  const { range: innerRange } = inner;
  if (outerRange === undefined || innerRange === undefined) return false;
  return outerRange[0] <= innerRange[0] && innerRange[1] <= outerRange[1];
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

/** 候補のうち、内側に別の候補を含まない (最も内側の) ものだけを残す */
function innermostOnly(candidates: readonly FunctionNode[]): FunctionNode[] {
  return candidates.filter(
    (fn) => !candidates.some((inner) => inner !== fn && containsRange(fn, inner)),
  );
}

/** メンバーアクセスと引数渡しの両方を含む、最も内側の関数を求める */
function mixedFunctions(
  member: readonly TSESTree.Node[],
  passed: readonly TSESTree.Node[],
): FunctionNode[] {
  const memberFns = new Set(member.flatMap(enclosingFunctions));
  const candidates = passed.flatMap(enclosingFunctions).filter((fn) => memberFns.has(fn));
  return innermostOnly(unique(candidates));
}

/** 赤線は関数のヘッダに出す (位置の計算は公式ヘルパーに委ねる) */
function findingAt(fn: FunctionNode, name: string, sourceCode: TSESLint.SourceCode): Finding {
  const loc = getFunctionHeadLocation(fn, sourceCode);
  return { loc, messageId: 'both', data: { name } };
}

function usageFindings(usage: Usage, name: string, sourceCode: TSESLint.SourceCode): Finding[] {
  const { member, passed } = usage;
  const { length: memberCount } = member;
  const { length: passedCount } = passed;
  if (memberCount === 0 || passedCount === 0) return [];
  return mixedFunctions(member, passed).map((fn) => findingAt(fn, name, sourceCode));
}

function variableFindings(
  variable: TSESLint.Scope.Variable,
  sourceCode: TSESLint.SourceCode,
): Finding[] {
  if (!isTargetVariable(variable)) return [];
  const { name } = variable;
  return usageFindings(collectUsage(variable), name, sourceCode);
}

function collectFindings(sourceCode: TSESLint.SourceCode): Finding[] {
  const { scopeManager } = sourceCode;
  const scopes = scopeManager?.scopes ?? [];
  return scopes.flatMap((scope) => scope.variables.flatMap((v) => variableFindings(v, sourceCode)));
}

/**
 * 呼び出すか渡すか: 関数は、オブジェクトのメンバー (メソッド・プロパティ) に
 * アクセスするか、オブジェクトを引数として他の関数へ渡すかのどちらか一方だけを行う
 */
export const callOrPass = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      both: 'この関数は変数 {{name}} をメンバーアクセスと引数渡しの両方に使っている。どちらか一方に揃える (呼び出すか渡すか)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      'Program:exit'() {
        for (const finding of collectFindings(context.sourceCode)) {
          context.report(finding);
        }
      },
    };
  },
});
