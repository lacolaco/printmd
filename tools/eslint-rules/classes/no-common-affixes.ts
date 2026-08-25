import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { allScopes, distinct } from '../support/ast-utils';

type MessageIds = 'commonAffix';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

interface NamedEntry {
  name: string;
  node: TSESTree.Node;
}

interface TaggedName {
  node: TSESTree.Node;
  words: readonly string[];
}

/** 検査対象の宣言種別。import 束縛と型宣言は他所の名前なので数えない */
const COUNTED_DEFS: ReadonlySet<string> = new Set([
  'Variable',
  'FunctionName',
  'ClassName',
  'Parameter',
  'CatchClause',
]);

const WORD_BOUNDARY = /(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|_/;

/** 文法上のマーカー。それ自体は接頭辞と見なさず、次の語を実質の接頭辞とする */
const MARKER_PREFIXES: ReadonlySet<string> = new Set(['on', 'is']);

function splitWords(name: string): string[] {
  const bare = name.replace(/^[#_$]+/, '');
  const words = bare.split(WORD_BOUNDARY).filter((word) => word !== '');
  const lower = words.map((word) => word.toLowerCase());
  return lower.length > 1 && MARKER_PREFIXES.has(lower[0]) ? lower.slice(1) : lower;
}

/** 2 語以上の複合名だけが語を共有しうる。単一語の名前は対象外 */
function compoundParts(name: string): string[] {
  const words = splitWords(name);
  const { length } = words;
  return length >= 2 ? distinct(words) : [];
}

function bucketFor(groups: Map<string, TSESTree.Node[]>, word: string): TSESTree.Node[] {
  const bucket = groups.get(word) ?? [];
  groups.set(word, bucket);
  return bucket;
}

function collectGroups(tagged: readonly TaggedName[]): Map<string, TSESTree.Node[]> {
  const groups = new Map<string, TSESTree.Node[]>();
  tagged.forEach(({ node, words }) => words.forEach((word) => bucketFor(groups, word).push(node)));
  return groups;
}

function flagIfShared(context: Context, affix: string, group: readonly TSESTree.Node[]): void {
  if (group.length >= 2) {
    group.forEach((node) => context.report({ node, messageId: 'commonAffix', data: { affix } }));
  }
}

function reportDuplicates(context: Context, groups: Map<string, TSESTree.Node[]>): void {
  groups.forEach((group, affix) => {
    flagIfShared(context, affix, group);
  });
}

function auditEntries(context: Context, entries: readonly NamedEntry[]): void {
  const tagged = entries.map(({ name, node }) => ({ node, words: compoundParts(name) }));
  reportDuplicates(context, collectGroups(tagged));
}

function keyOf(member: TSESTree.ClassElement): TSESTree.Node | undefined {
  const isNamed =
    member.type === 'MethodDefinition' || member.type === 'PropertyDefinition' ? member : undefined;
  return isNamed?.key;
}

function isNamed(
  key: TSESTree.Node | undefined,
): key is TSESTree.Identifier | TSESTree.PrivateIdentifier {
  return key?.type === 'Identifier' || key?.type === 'PrivateIdentifier';
}

function classMembers(body: TSESTree.ClassBody): NamedEntry[] {
  const keys = body.body.map((member) => keyOf(member));
  return keys.filter(isNamed).map((key) => ({ name: key.name, node: key }));
}

function scopeVariables(scope: TSESLint.Scope.Scope): NamedEntry[] {
  const counted = scope.variables.filter(
    ({ defs, identifiers }) =>
      identifiers.length > 0 && defs.some(({ type }) => COUNTED_DEFS.has(type)),
  );
  return counted.map(({ name, identifiers }) => ({ name, node: identifiers[0] }));
}

function sweepScopes(context: Context, sourceCode: TSESLint.SourceCode): void {
  allScopes(sourceCode).forEach((scope) => auditEntries(context, scopeVariables(scope)));
}

/**
 * 共通の接頭辞・接尾辞を持たせない。同一スコープ (クラス本体・変数スコープ) で
 * 複合名どうしが語を共有したら (位置を問わない)、カプセル化の不足として報告する
 */
export const noCommonAffixes = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      commonAffix:
        '同一スコープに語「{{affix}}」を共有する名前が複数ある。既定は共有している語ごとクラスへ束ねて解くこと。改名してよいのは、共有が動詞や前置詞の偶発的な一致である場合に限る',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;
    return {
      ClassBody: (node) => auditEntries(context, classMembers(node)),
      Program: () => sweepScopes(context, sourceCode),
    };
  },
});
