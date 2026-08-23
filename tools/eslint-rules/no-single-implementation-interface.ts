import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

type MessageIds = 'singleImplementation';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

const countsCache = new WeakMap<ts.Program, Map<ts.Symbol, number>>();

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  const { flags } = symbol;
  const isAlias = (flags & ts.SymbolFlags.Alias) !== 0;
  return isAlias ? checker.getAliasedSymbol(symbol) : symbol;
}

function rawSymbolAt(checker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
  return checker.getSymbolAtLocation(node);
}

function symbolsAt(checker: ts.TypeChecker, node: ts.Node): ts.Symbol[] {
  const symbol = rawSymbolAt(checker, node);
  return symbol === undefined ? [] : [resolveAlias(checker, symbol)];
}

function isImplementsClause(clause: ts.HeritageClause): boolean {
  return clause.token === ts.SyntaxKind.ImplementsKeyword;
}

function implementsClausesOf(node: ts.Node): readonly ts.HeritageClause[] {
  const cls = ts.isClassDeclaration(node) || ts.isClassExpression(node) ? node : undefined;
  const clauses = cls?.heritageClauses ?? [];
  return clauses.filter(isImplementsClause);
}

function heritageSymbols(checker: ts.TypeChecker, clause: ts.HeritageClause): ts.Symbol[] {
  return clause.types.flatMap((type) => symbolsAt(checker, type.expression));
}

/** 部分木から implements されたインタフェースのシンボルを集める */
function collectImplemented(checker: ts.TypeChecker, node: ts.Node): ts.Symbol[] {
  const own = implementsClausesOf(node).flatMap((clause) => heritageSymbols(checker, clause));
  const nested: ts.Symbol[] = [];
  ts.forEachChild(node, (child) => {
    nested.push(...collectImplemented(checker, child));
  });
  return [...own, ...nested];
}

function countBy(symbols: readonly ts.Symbol[]): Map<ts.Symbol, number> {
  const counts = new Map<ts.Symbol, number>();
  symbols.forEach((symbol) => counts.set(symbol, (counts.get(symbol) ?? 0) + 1));
  return counts;
}

function implementerCounts(program: ts.Program): Map<ts.Symbol, number> {
  const checker = program.getTypeChecker();
  const files = program.getSourceFiles().filter((file) => !file.isDeclarationFile);
  return countBy(files.flatMap((file) => collectImplemented(checker, file)));
}

function cachedCounts(program: ts.Program): Map<ts.Symbol, number> {
  const cached = countsCache.get(program) ?? implementerCounts(program);
  countsCache.set(program, cached);
  return cached;
}

function isSingleImplementation(program: ts.Program, symbol: ts.Symbol): boolean {
  return cachedCounts(program).get(symbol) === 1;
}

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

function checkerOf(program: ts.Program): ts.TypeChecker {
  return program.getTypeChecker();
}

function interfaceNameNode(
  esMap: Services['esTreeNodeToTSNodeMap'],
  node: TSESTree.TSInterfaceDeclaration,
): ts.Node {
  const tsNode = esMap.get(node);
  return tsNode.name;
}

function reportIfSingle(
  context: Context,
  program: ts.Program,
  checker: ts.TypeChecker,
  esMap: Services['esTreeNodeToTSNodeMap'],
  node: TSESTree.TSInterfaceDeclaration,
): void {
  const { id } = node;
  const singles = symbolsAt(checker, interfaceNameNode(esMap, node)).filter((symbol) =>
    isSingleImplementation(program, symbol),
  );
  singles.forEach(() => context.report({ node: id, messageId: 'singleImplementation' }));
}

function makeListener(context: Context, services: Services) {
  const { program, esTreeNodeToTSNodeMap } = services;
  const checker = checkerOf(program);
  return (node: TSESTree.TSInterfaceDeclaration): void =>
    reportIfSingle(context, program, checker, esTreeNodeToTSNodeMap, node);
}

/**
 * 実装が 1 つしかないインタフェースは作らない。interface 宣言を起点に、プログラム
 * 全体で implements している実装クラスを数え、ちょうど 1 つなら宣言名に報告する
 */
export const noSingleImplementationInterface = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      singleImplementation:
        '実装が 1 つしかないインタフェースを作らない。実装クラスへ直接依存するか、2 つ目の実装ができるまでインタフェースを消す',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { TSInterfaceDeclaration: makeListener(context, services) };
  },
});
