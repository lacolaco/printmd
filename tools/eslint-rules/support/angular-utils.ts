import type { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type * as ts from 'typescript';
import { lookupSymbol, resolveAlias } from './ts-utils';

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

function calleeName(expression: TSESTree.Node): TSESTree.Node | undefined {
  const call = expression.type === 'CallExpression' ? expression : undefined;
  const callee = call?.callee;
  return callee?.type === 'MemberExpression' ? callee.property : callee;
}

function resolved(services: Services, node: TSESTree.Node): ts.Symbol | undefined {
  const { program, esTreeNodeToTSNodeMap } = services;
  const checker = program.getTypeChecker();
  const raw = lookupSymbol(checker, esTreeNodeToTSNodeMap.get(node));
  return raw === undefined ? undefined : resolveAlias(checker, raw);
}

/** デコレータが @angular/core の expected か。別名 import や名前空間 import も追跡する */
function isFromCore(services: Services, decorator: TSESTree.Decorator, expected: string): boolean {
  const target = calleeName(decorator.expression);
  const symbol = target === undefined ? undefined : resolved(services, target);
  const { name } = symbol ?? { name: '' };
  return name === expected && originOf(symbol).includes('@angular/core');
}

export function isDecorated(
  services: Services,
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
  expected: string,
): boolean {
  return node.decorators.some((decorator) => isFromCore(services, decorator, expected));
}

/** クラスメンバー (parent = ClassBody) からその所属クラスを得る */
export function enclosingClass(
  node: TSESTree.Node,
): TSESTree.ClassDeclaration | TSESTree.ClassExpression {
  return node.parent?.parent as TSESTree.ClassDeclaration | TSESTree.ClassExpression;
}

export function resolvedSymbol(services: Services, node: TSESTree.Node): ts.Symbol | undefined {
  return resolved(services, node);
}

export function originOf(symbol: ts.Symbol | undefined): string {
  return symbol?.declarations?.[0]?.getSourceFile().fileName ?? '';
}

const MANAGED_DECORATORS: readonly string[] = [
  'Component',
  'Directive',
  'Pipe',
  'Injectable',
  'Service',
];

/** Angular が生成を管理するクラス (協力オブジェクトは DI から受け取るべき対象) か */
export function isManaged(
  services: Services,
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): boolean {
  return MANAGED_DECORATORS.some((expected) => isDecorated(services, node, expected));
}

export function isAngularComponent(
  services: Services,
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
): boolean {
  return isDecorated(services, node, 'Component');
}
