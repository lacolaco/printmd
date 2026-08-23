import type { TSESTree } from '@typescript-eslint/utils';

function decoratorLabel(decorator: TSESTree.Decorator): string {
  const { expression } = decorator;
  const call = expression.type === 'CallExpression' ? expression : undefined;
  return call?.callee.type === 'Identifier' ? call.callee.name : '';
}

export function isComponentClass(
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): boolean {
  return node.decorators.some((decorator) => decoratorLabel(decorator) === 'Component');
}

function textOf(name: TSESTree.Identifier | TSESTree.StringLiteral): string {
  return name.type === 'Identifier' ? name.name : name.value;
}

function importedName(specifier: TSESTree.ImportClause): string {
  const named = specifier.type === 'ImportSpecifier' ? specifier.imported : undefined;
  return named === undefined ? '' : textOf(named);
}

/** @angular/core から Component を import している文か */
function isCoreImport(statement: TSESTree.ProgramStatement): boolean {
  const imp =
    statement.type === 'ImportDeclaration' && statement.source.value === '@angular/core'
      ? statement
      : undefined;
  return (imp?.specifiers ?? []).some((specifier) => importedName(specifier) === 'Component');
}

/** このモジュールが Angular のコンポーネントを定義しうるか */
export function isAngularModule(program: TSESTree.Program): boolean {
  return program.body.some((statement) => isCoreImport(statement));
}
