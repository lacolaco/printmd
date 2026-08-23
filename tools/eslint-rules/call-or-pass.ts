import type { Rule, Scope, SourceCode } from 'eslint';
import type { Node } from 'estree';

type WithParent = Node & { parent?: WithParent };

interface Usage {
  member: Node[];
  passed: Node[];
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

function effectiveUse(node: WithParent): { use: Node; parent: WithParent | undefined } {
  const { parent } = node;
  if (parent === undefined) return { use: node, parent };
  const { type } = parent;
  return ASSERTION_TYPES.has(type) ? effectiveUse(parent) : { use: node, parent };
}

function isMemberReceiver(parent: WithParent, id: Node): boolean {
  return parent.type === 'MemberExpression' && parent.object === id;
}

/** スプレッド (fn(...x)) は 1 段だけ潜り、呼び出しないし new の引数か判定する */
function isCallArgument(parent: WithParent, id: Node): boolean {
  const viaSpread = parent.type === 'SpreadElement';
  const container = viaSpread ? parent.parent : parent;
  const argument: Node = viaSpread ? parent : id;
  if (container?.type !== 'CallExpression' && container?.type !== 'NewExpression') return false;
  return (container.arguments as Node[]).includes(argument);
}

function classify(id: Node): keyof Usage | null {
  const { use, parent } = effectiveUse(id as WithParent);
  if (parent === undefined) return null;
  if (isMemberReceiver(parent, use)) return 'member';
  return isCallArgument(parent, use) ? 'passed' : null;
}

const TARGET_DEF_TYPES: ReadonlySet<string> = new Set(['Parameter', 'Variable', 'CatchClause']);

/** 対象は関数内で宣言された引数・ローカル変数・catch 変数 (モジュールスコープは除く) */
function isTargetVariable(variable: Scope.Variable): boolean {
  const def = variable.defs[0];
  if (def === undefined || !TARGET_DEF_TYPES.has(def.type)) return false;
  return variable.scope.variableScope.type === 'function';
}

function markUsage(usage: Usage, id: Node): void {
  const kind = classify(id);
  if (kind !== null) usage[kind].push(id);
}

function collectUsage(variable: Scope.Variable): Usage {
  const usage: Usage = { member: [], passed: [] };
  for (const reference of variable.references) {
    markUsage(usage, reference.identifier);
  }
  return usage;
}

function parentOf(node: WithParent): WithParent | undefined {
  return node.parent;
}

function appendIfFunction(chain: WithParent[], node: WithParent): void {
  const { type } = node;
  if (FUNCTION_TYPES.has(type)) chain.push(node);
}

/** ノードを包む関数ノードを内側から外側の順で集める */
function enclosingFunctions(id: Node): WithParent[] {
  const chain: WithParent[] = [];
  for (let node = (id as WithParent).parent; node; node = parentOf(node)) {
    appendIfFunction(chain, node);
  }
  return chain;
}

function containsRange(outer: Node, inner: Node): boolean {
  const [outerStart, outerEnd] = outer.range ?? [0, 0];
  const [innerStart, innerEnd] = inner.range ?? [0, 0];
  return outerStart <= innerStart && innerEnd <= outerEnd;
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

/** 候補のうち、内側に別の候補を含まない (最も内側の) ものだけを残す */
function innermostOnly(candidates: readonly WithParent[]): WithParent[] {
  return candidates.filter(
    (fn) => !candidates.some((inner) => inner !== fn && containsRange(fn, inner)),
  );
}

/** メンバーアクセスと引数渡しの両方を含む、最も内側の関数を求める */
function mixedFunctions(member: readonly Node[], passed: readonly Node[]): WithParent[] {
  const memberFns = new Set(member.flatMap(enclosingFunctions));
  const candidates = passed.flatMap(enclosingFunctions).filter((fn) => memberFns.has(fn));
  return innermostOnly(unique(candidates));
}

/** 赤線は関数のヘッダ (宣言から本体の開始まで) に出す */
function findingAt(fn: WithParent, name: string): Rule.ReportDescriptor {
  const { body, loc } = fn as WithParent & { body: WithParent };
  const start = loc?.start ?? { line: 1, column: 0 };
  const end = body.loc?.start ?? start;
  return { loc: { start, end }, messageId: 'both', data: { name } };
}

function usageFindings(usage: Usage, name: string): Rule.ReportDescriptor[] {
  const { member, passed } = usage;
  const { length: memberCount } = member;
  const { length: passedCount } = passed;
  if (memberCount === 0 || passedCount === 0) return [];
  return mixedFunctions(member, passed).map((fn) => findingAt(fn, name));
}

function variableFindings(variable: Scope.Variable): Rule.ReportDescriptor[] {
  if (!isTargetVariable(variable)) return [];
  const { name } = variable;
  return usageFindings(collectUsage(variable), name);
}

function collectFindings(sourceCode: SourceCode): Rule.ReportDescriptor[] {
  const scopes = sourceCode.scopeManager?.scopes ?? [];
  return scopes.flatMap((scope) => scope.variables.flatMap(variableFindings));
}

/**
 * 呼び出すか渡すか: 関数は、オブジェクトのメンバー (メソッド・プロパティ) に
 * アクセスするか、オブジェクトを引数として他の関数へ渡すかのどちらか一方だけを行う
 */
export const callOrPass: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    messages: {
      both: 'この関数は変数 {{name}} をメンバーアクセスと引数渡しの両方に使っている。どちらか一方に揃える (呼び出すか渡すか)',
    },
    schema: [],
  },
  create(context) {
    return {
      'Program:exit'() {
        for (const finding of collectFindings(context.sourceCode)) {
          context.report(finding);
        }
      },
    };
  },
};
