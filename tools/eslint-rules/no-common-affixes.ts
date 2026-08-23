import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { allScopes } from './ast-utils';

type MessageIds = 'commonAffix';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

interface NamedEntry {
  name: string;
  node: TSESTree.Node;
}

/** 接辞を 1 回だけ計算した検査単位 */
interface TaggedName {
  node: TSESTree.Node;
  prefix: string;
  suffix: string;
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

function splitWords(name: string): string[] {
  const bare = name.replace(/^[#_$]+/, '');
  const words = bare.split(WORD_BOUNDARY).filter((word) => word !== '');
  return words.map((word) => word.toLowerCase());
}

/** 2 語以上の名前だけが接辞 (先頭語・末尾語) を持つ */
function affixPair(name: string): { prefix: string; suffix: string } {
  const words = splitWords(name);
  const proper = words.length >= 2;
  return { prefix: proper ? words[0] : '', suffix: proper ? words[words.length - 1] : '' };
}

function bucketFor(groups: Map<string, TaggedName[]>, affix: string): TaggedName[] {
  const bucket = groups.get(affix) ?? [];
  groups.set(affix, bucket);
  return bucket;
}

function appendGroup(groups: Map<string, TaggedName[]>, affix: string, item: TaggedName): void {
  if (affix !== '') {
    bucketFor(groups, affix).push(item);
  }
}

function groupBy(
  tagged: readonly TaggedName[],
  select: (item: TaggedName) => string,
): Map<string, TaggedName[]> {
  const groups = new Map<string, TaggedName[]>();
  tagged.forEach((item) => appendGroup(groups, select(item), item));
  return groups;
}

function flagIfShared(context: Context, affix: string, group: TaggedName[]): void {
  if (group.length >= 2) {
    group.forEach(({ node }) =>
      context.report({ node, messageId: 'commonAffix', data: { affix } }),
    );
  }
}

function reportDuplicates(context: Context, groups: Map<string, TaggedName[]>): void {
  groups.forEach((group, affix) => {
    flagIfShared(context, affix, group);
  });
}

function checkSide(
  context: Context,
  tagged: readonly TaggedName[],
  select: (item: TaggedName) => string,
): void {
  reportDuplicates(context, groupBy(tagged, select));
}

function auditEntries(context: Context, entries: readonly NamedEntry[]): void {
  const tagged = entries.map(({ name, node }) => ({ node, ...affixPair(name) }));
  checkSide(context, tagged, (item) => item.prefix);
  checkSide(context, tagged, (item) => item.suffix);
}

function keyOf(member: TSESTree.ClassElement): TSESTree.Node | undefined {
  const named =
    member.type === 'MethodDefinition' || member.type === 'PropertyDefinition' ? member : undefined;
  return named?.key;
}

function named(
  key: TSESTree.Node | undefined,
): key is TSESTree.Identifier | TSESTree.PrivateIdentifier {
  return key?.type === 'Identifier' || key?.type === 'PrivateIdentifier';
}

function classMembers(body: TSESTree.ClassBody): NamedEntry[] {
  const keys = body.body.map((member) => keyOf(member));
  return keys.filter(named).map((key) => ({ name: key.name, node: key }));
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
 * 複数語の名前どうしが先頭語または末尾語を共有したら、カプセル化の不足として報告する
 */
export const noCommonAffixes = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      commonAffix:
        '同一スコープに接辞「{{affix}}」を共有する名前が複数ある。クラスへのカプセル化が不足している (共通の接頭辞・接尾辞を持たせない)',
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
