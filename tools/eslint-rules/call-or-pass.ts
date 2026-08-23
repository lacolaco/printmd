import type { Rule, Scope, SourceCode } from 'eslint';
import type { Node } from 'estree';

type WithParent = Node & { parent?: WithParent };

interface Usage {
  member: boolean;
  passed: boolean;
}

function parentOf(node: Node): WithParent | undefined {
  return (node as WithParent).parent;
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
  const parent = parentOf(id);
  if (parent === undefined) return null;
  if (isMemberReceiver(parent, id)) return 'member';
  return isCallArgument(parent, id) ? 'passed' : null;
}

/** 対象は関数内で宣言された引数とローカル変数だけ (モジュールスコープは除く) */
function isTargetVariable(variable: Scope.Variable): boolean {
  const def = variable.defs[0];
  if (def === undefined) return false;
  if (def.type !== 'Parameter' && def.type !== 'Variable') return false;
  return variable.scope.variableScope.type === 'function';
}

function markUsage(usage: Usage, id: Node): void {
  const kind = classify(id);
  if (kind !== null) usage[kind] = true;
}

function collectUsage(variable: Scope.Variable): Usage {
  const usage: Usage = { member: false, passed: false };
  for (const reference of variable.references) {
    markUsage(usage, reference.identifier);
  }
  return usage;
}

function usesBothWays(variable: Scope.Variable): boolean {
  const usage = collectUsage(variable);
  return usage.member && usage.passed;
}

function bothWaysFinding(variable: Scope.Variable): Rule.ReportDescriptor {
  const node = variable.defs[0].name as unknown as Rule.Node;
  return { node, messageId: 'both', data: { name: variable.name } };
}

function variableFindings(variable: Scope.Variable): Rule.ReportDescriptor[] {
  if (!isTargetVariable(variable)) return [];
  if (!usesBothWays(variable)) return [];
  return [bothWaysFinding(variable)];
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
      both: '変数 {{name}} をメンバーアクセスと引数渡しの両方に使っている。どちらか一方に揃える (呼び出すか渡すか)',
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
