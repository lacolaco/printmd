import type { TSESLint } from '@typescript-eslint/utils';

export function distinct<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

export function allScopes(sourceCode: TSESLint.SourceCode): TSESLint.Scope.Scope[] {
  const { scopeManager } = sourceCode;
  return scopeManager?.scopes ?? [];
}
