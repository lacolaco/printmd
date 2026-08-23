import * as ts from 'typescript';

export function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  const { flags } = symbol;
  const isAlias = (flags & ts.SymbolFlags.Alias) !== 0;
  return isAlias ? checker.getAliasedSymbol(symbol) : symbol;
}

export function lookupSymbol(checker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
  return checker.getSymbolAtLocation(node);
}
