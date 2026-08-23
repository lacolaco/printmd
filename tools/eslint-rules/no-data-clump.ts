import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import * as ts from 'typescript';
import { distinct } from './ast-utils';

type MessageIds = 'dataClump';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

function literalAlias(statement: ts.Statement): statement is ts.TypeAliasDeclaration {
  const alias = ts.isTypeAliasDeclaration(statement) ? statement : undefined;
  return alias !== undefined && ts.isTypeLiteralNode(alias.type);
}

/** 対象はモジュール内で形を定義した型だけ (interface とオブジェクトリテラル型の別名) */
function ownShape(
  statement: ts.Statement,
): statement is ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
  return ts.isInterfaceDeclaration(statement) || literalAlias(statement);
}

function localTypes(file: ts.SourceFile): Map<string, ts.DeclarationStatement> {
  const declarations = file.statements.filter(ownShape);
  return new Map(declarations.map((declaration) => [declaration.name.text, declaration]));
}

function moduleFunctions(file: ts.SourceFile): ts.FunctionDeclaration[] {
  return file.statements.filter((statement) => ts.isFunctionDeclaration(statement));
}

/** モジュール関数の引数型を集計し、複数の関数に受け回されたローカル型を見つける */
class Census {
  private readonly counts = new Map<string, number>();

  constructor(private readonly checker: ts.TypeChecker) {}

  survey(file: ts.SourceFile): ts.DeclarationStatement[] {
    moduleFunctions(file).forEach((fn) => this.tally(fn));
    const declared = [...localTypes(file).entries()];
    return declared.filter(([name]) => (this.counts.get(name) ?? 0) >= 2).map(([, node]) => node);
  }

  private tally(fn: ts.SignatureDeclaration): void {
    const names = fn.parameters.flatMap((parameter) => this.nameOf(parameter));
    distinct(names).forEach((name) => this.counts.set(name, (this.counts.get(name) ?? 0) + 1));
  }

  private nameOf(parameter: ts.ParameterDeclaration): string[] {
    const bare = this.element(this.checker.getTypeAtLocation(parameter));
    const symbol = bare.aliasSymbol ?? bare.getSymbol();
    return symbol === undefined ? [] : [symbol.name];
  }

  /** 配列・readonly 配列は要素型まで潜って判定する */
  private element(type: ts.Type): ts.Type {
    return this.checker.getIndexTypeOfType(type, ts.IndexKind.Number) ?? type;
  }
}

function reportClumps(context: Context, services: Services, node: TSESTree.Program): void {
  const { program, esTreeNodeToTSNodeMap } = services;
  const file = esTreeNodeToTSNodeMap.get(node);
  const scan = new Census(program.getTypeChecker());
  scan.survey(file).forEach(({ name }) => flagAt(context, services, name));
}

function flagAt(context: Context, services: Services, name: ts.Node | undefined): void {
  if (name !== undefined) {
    const { loc } = services.tsNodeToESTreeNodeMap.get(name);
    context.report({ loc, messageId: 'dataClump' });
  }
}

/**
 * データの群れの禁止。モジュール内で形を定義した型を、同一モジュールの複数の
 * モジュール関数が引数で受け回していたら、その型はクラスにして振る舞いを
 * メソッドとして持つべきである。関数や引数の改名では回避できない
 */
export const noDataClump = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      dataClump:
        'この型は複数のモジュール関数に引数で受け回されている。クラスにして操作をメソッドへ移す (データの群れの禁止)',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { Program: (node) => reportClumps(context, services, node) };
  },
});
