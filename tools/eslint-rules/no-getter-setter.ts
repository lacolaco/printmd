import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';

type MessageIds = 'noGetterSetter';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

const ACCESSOR_NAME_PATTERN = /^(get|set)[A-Z_$]/;

function methodNameOf(node: TSESTree.MethodDefinition): string {
  const { key } = node;
  return key.type === 'Identifier' ? key.name : '';
}

/** 構文の get/set アクセサ、または getXxx / setXxx 命名のメソッドか */
function isAccessorLike(node: TSESTree.MethodDefinition): boolean {
  const { kind } = node;
  const isSyntaxAccessor = kind === 'get' || kind === 'set';
  return isSyntaxAccessor || ACCESSOR_NAME_PATTERN.test(methodNameOf(node));
}

function isBooleanType(type: ts.Type): boolean {
  const { flags } = type;
  return (flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.Boolean)) !== 0;
}

function returnTypeOf(checker: ts.TypeChecker, declaration: ts.SignatureDeclaration): ts.Type {
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
function isBooleanAccessor(
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  isSetter: boolean,
): boolean {
  const type = isSetter
    ? firstParameterType(checker, declaration)
    : returnTypeOf(checker, declaration);
  return isBooleanType(type);
}

function isSetterLike(node: TSESTree.MethodDefinition): boolean {
  const { kind } = node;
  return kind === 'set' || methodNameOf(node).startsWith('set');
}

function reportAccessor(context: Context, node: TSESTree.MethodDefinition): void {
  const { key } = node;
  context.report({ node: key, messageId: 'noGetterSetter' });
}

function checkMethod(
  context: Context,
  checker: ts.TypeChecker,
  esMap: Services['esTreeNodeToTSNodeMap'],
  node: TSESTree.MethodDefinition,
): void {
  const accessorLike = isAccessorLike(node);
  const declaration = esMap.get(node) as ts.SignatureDeclaration;
  const excepted = accessorLike && isBooleanAccessor(checker, declaration, isSetterLike(node));
  reportUnlessExcepted(context, node, accessorLike && !excepted);
}

function reportUnlessExcepted(
  context: Context,
  node: TSESTree.MethodDefinition,
  violated: boolean,
): void {
  if (violated) {
    reportAccessor(context, node);
  }
}

function checkerOf(program: ts.Program): ts.TypeChecker {
  return program.getTypeChecker();
}

function makeListener(context: Context, services: Services) {
  const { program, esTreeNodeToTSNodeMap } = services;
  const checker = checkerOf(program);
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
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { MethodDefinition: makeListener(context, services) };
  },
});
