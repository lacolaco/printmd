import { getFunctionHeadLocation } from '@eslint-community/eslint-utils';
import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import {
  effectiveUse,
  enclosingFunctions,
  innermostOnly,
  isCallArgument,
  isMemberReceiver,
  type FunctionNode,
} from './ast-utils';

type MessageIds = 'both';
type Finding = TSESLint.ReportDescriptor<MessageIds>;

interface Usage {
  member: TSESTree.Node[];
  passed: TSESTree.Node[];
}

function classify(id: TSESTree.Node): keyof Usage | null {
  const { use, parent } = effectiveUse(id);
  const member = parent !== undefined && isMemberReceiver(parent, use);
  const passed = parent !== undefined && isCallArgument(parent, use);
  return member ? 'member' : passed ? 'passed' : null;
}

const TARGET_DEF_TYPES: ReadonlySet<string> = new Set(['Parameter', 'Variable', 'CatchClause']);

/** 対象は関数内で宣言された引数・ローカル変数・catch 変数 (モジュールスコープは除く) */
function isTargetVariable(variable: TSESLint.Scope.Variable): boolean {
  const def = variable.defs[0];
  const isTargetDef = def !== undefined && TARGET_DEF_TYPES.has(def.type);
  return isTargetDef && variable.scope.variableScope.type === 'function';
}

function appendUsage(usage: Usage, kind: keyof Usage | null, id: TSESTree.Node): void {
  if (kind !== null) usage[kind].push(id);
}

function markUsage(usage: Usage, id: TSESTree.Node): void {
  appendUsage(usage, classify(id), id);
}

function collectUsage(variable: TSESLint.Scope.Variable): Usage {
  const usage: Usage = { member: [], passed: [] };
  for (const reference of variable.references) {
    markUsage(usage, reference.identifier);
  }
  return usage;
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
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
  const mixed = memberCount > 0 && passedCount > 0 ? mixedFunctions(member, passed) : [];
  return mixed.map((fn) => findingAt(fn, name, sourceCode));
}

function variableFindings(
  variable: TSESLint.Scope.Variable,
  sourceCode: TSESLint.SourceCode,
): Finding[] {
  const { name } = variable;
  return isTargetVariable(variable) ? usageFindings(collectUsage(variable), name, sourceCode) : [];
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
