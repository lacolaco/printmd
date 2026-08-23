import { getFunctionHeadLocation } from '@eslint-community/eslint-utils';
import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import {
  allScopes,
  distinct,
  effectiveUse,
  enclosingFunctions,
  innermostOnly,
  isCallArgument,
  usedAsReceiver,
  type FunctionNode,
} from './ast-utils';

type MessageIds = 'both';
type Finding = TSESLint.ReportDescriptor<MessageIds>;

type Kind = 'member' | 'passed';

function classify(id: TSESTree.Node): Kind | null {
  const { use, parent } = effectiveUse(id);
  const member = parent !== undefined && usedAsReceiver(parent, use);
  const passed = parent !== undefined && isCallArgument(parent, use);
  return member ? 'member' : passed ? 'passed' : null;
}

const TARGET_DEF_TYPES: ReadonlySet<string> = new Set(['Parameter', 'Variable', 'CatchClause']);

/** 対象は関数内で宣言された引数・ローカル変数・catch 変数 (モジュールスコープは除く) */
function isTarget(variable: TSESLint.Scope.Variable): boolean {
  const def = variable.defs[0];
  return (
    def !== undefined &&
    TARGET_DEF_TYPES.has(def.type) &&
    variable.scope.variableScope.type === 'function'
  );
}

/** 1 変数の全参照を、メンバーアクセスと引数渡しに分類して保持する */
class Usage {
  private readonly member: TSESTree.Node[] = [];
  private readonly passed: TSESTree.Node[] = [];

  record(id: TSESTree.Node): void {
    this.append(classify(id), id);
  }

  private append(kind: Kind | null, id: TSESTree.Node): void {
    if (kind !== null) {
      this[kind].push(id);
    }
  }

  findings(name: string, sourceCode: TSESLint.SourceCode): Finding[] {
    return this.mixed().map((fn) => findingAt(fn, name, sourceCode));
  }

  private mixed(): FunctionNode[] {
    const both = this.member.length > 0 && this.passed.length > 0;
    return both ? mixedFunctions(this.member, this.passed) : [];
  }
}

function usesOf(variable: TSESLint.Scope.Variable): Usage {
  const usage = new Usage();
  for (const reference of variable.references) {
    usage.record(reference.identifier);
  }
  return usage;
}

/** メンバーアクセスと引数渡しの両方を含む、最も内側の関数を求める */
function mixedFunctions(
  member: readonly TSESTree.Node[],
  passed: readonly TSESTree.Node[],
): FunctionNode[] {
  const memberFns = new Set(member.flatMap(enclosingFunctions));
  const candidates = passed.flatMap(enclosingFunctions).filter((fn) => memberFns.has(fn));
  return innermostOnly(distinct(candidates));
}

/** 赤線は関数のヘッダに出す (位置の計算は公式ヘルパーに委ねる) */
function findingAt(fn: FunctionNode, name: string, sourceCode: TSESLint.SourceCode): Finding {
  const loc = getFunctionHeadLocation(fn, sourceCode);
  return { loc, messageId: 'both', data: { name } };
}

function checkVariable(
  variable: TSESLint.Scope.Variable,
  sourceCode: TSESLint.SourceCode,
): Finding[] {
  const { name } = variable;
  return isTarget(variable) ? usesOf(variable).findings(name, sourceCode) : [];
}

function allFindings(sourceCode: TSESLint.SourceCode): Finding[] {
  const scopes = allScopes(sourceCode);
  return scopes.flatMap((scope) => scope.variables.flatMap((v) => checkVariable(v, sourceCode)));
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
        for (const finding of allFindings(context.sourceCode)) {
          context.report(finding);
        }
      },
    };
  },
});
