import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

type MessageIds = 'noGetterSetter' | 'boolNeedsIs';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

const NAMING_PATTERN = /^(get|set)[A-Z_$]/;

const IS_PATTERN = /^is([A-Z_$]|$)/;

function declaredName(node: TSESTree.MethodDefinition): string {
  const { key } = node;
  return key.type === 'Identifier' || key.type === 'PrivateIdentifier' ? key.name : '';
}

/** 構文の get/set アクセサ、または getXxx / setXxx 命名のメソッドか */
function looksAccessor(node: TSESTree.MethodDefinition): boolean {
  const { kind } = node;
  const isSyntaxAccessor = kind === 'get' || kind === 'set';
  return isSyntaxAccessor || NAMING_PATTERN.test(declaredName(node));
}

function booleanFlagged(type: ts.Type): boolean {
  const { flags } = type;
  return (flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.Boolean)) !== 0;
}

function resultOf(checker: ts.TypeChecker, declaration: ts.SignatureDeclaration): ts.Type {
  const signature = checker.getSignatureFromDeclaration(declaration);
  return signature === undefined ? checker.getAnyType() : signature.getReturnType();
}

function firstParameterType(
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
): ts.Type {
  const parameter = declaration.parameters[0];
  return parameter === undefined ? checker.getAnyType() : checker.getTypeAtLocation(parameter);
}

/** ブール型フィールドの例外: getter は返り値、setter は第 1 引数がブール型なら許す */
function exempted(
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  isSetter: boolean,
): boolean {
  const type = isSetter ? firstParameterType(checker, declaration) : resultOf(checker, declaration);
  return booleanFlagged(type);
}

function writesValue(node: TSESTree.MethodDefinition): boolean {
  const { kind } = node;
  return kind === 'set' || declaredName(node).startsWith('set');
}

function flagViolation(
  context: Context,
  node: TSESTree.MethodDefinition,
  messageId: MessageIds,
): void {
  const { key } = node;
  context.report({ node: key, messageId });
}

/** boolean を返す問い合わせ (get アクセサ・メソッド) か。setter は対象外 */
function yieldsBool(
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  node: TSESTree.MethodDefinition,
): boolean {
  const { kind } = node;
  return kind !== 'set' && booleanFlagged(resultOf(checker, declaration));
}

function auditShape(
  context: Context,
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  node: TSESTree.MethodDefinition,
): void {
  const accessorLike = looksAccessor(node);
  const excepted = accessorLike && exempted(checker, declaration, writesValue(node));
  reportUnlessExcepted(context, node, accessorLike && !excepted);
}

function enforceIsPrefix(
  context: Context,
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  node: TSESTree.MethodDefinition,
): void {
  const bool = yieldsBool(checker, declaration, node);
  requireMarker(context, node, bool && !IS_PATTERN.test(declaredName(node)));
}

function requireMarker(context: Context, node: TSESTree.MethodDefinition, violated: boolean): void {
  if (violated) {
    flagViolation(context, node, 'boolNeedsIs');
  }
}

function checkMethod(
  context: Context,
  checker: ts.TypeChecker,
  esMap: Services['esTreeNodeToTSNodeMap'],
  node: TSESTree.MethodDefinition,
): void {
  const declaration = esMap.get(node) as ts.SignatureDeclaration;
  auditShape(context, checker, declaration, node);
  enforceIsPrefix(context, checker, declaration, node);
}

function reportUnlessExcepted(
  context: Context,
  node: TSESTree.MethodDefinition,
  violated: boolean,
): void {
  if (violated) {
    flagViolation(context, node, 'noGetterSetter');
  }
}

function makeListener(context: Context, services: Services) {
  const { program, esTreeNodeToTSNodeMap } = services;
  const checker = program.getTypeChecker();
  return (node: TSESTree.MethodDefinition): void =>
    checkMethod(context, checker, esTreeNodeToTSNodeMap, node);
}

/**
 * getter と setter は使わない (デメテルの法則)。構文の get/set アクセサと、
 * getXxx / setXxx 命名のメソッドによるカプセル化を禁止する。
 * ブール型のフィールド (getter の返り値・setter の第 1 引数がブール型) は例外
 */
export const noGetterSetter = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      noGetterSetter:
        'getter / setter を使わない。データを取り出して外で操作するのではなく、振る舞いをオブジェクト側へ移す (デメテルの法則)。ブール型のフィールドのみ例外',
      boolNeedsIs: 'boolean を返す問い合わせは is で始める (isXxx)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { MethodDefinition: makeListener(context, services) };
  },
});
