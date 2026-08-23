import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { isDecorated } from '../support/angular-utils';

type MessageIds = 'statelessModule';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

function classOf(statement: TSESTree.ProgramStatement): TSESTree.ClassDeclaration | undefined {
  const inner = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
  return inner?.type === 'ClassDeclaration' ? inner : undefined;
}

function audit(context: Context, services: Services, program: TSESTree.Program): void {
  const classes = program.body.map((statement) => classOf(statement));
  const store = classes.some((cls) => cls !== undefined && isDecorated(services, cls, 'Service'));
  condemn(context, !store);
}

function condemn(context: Context, violated: boolean): void {
  if (violated) {
    context.report({ loc: { line: 1, column: 0 }, messageId: 'statelessModule' });
  }
}

/**
 * 状態以外のモジュールを禁止する。状態ディレクトリに適用し、@Service の
 * 状態クラスを持たないモジュール (値オブジェクトやドメインロジック) の紛れ込みを検出する
 */
export const requireState = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      statelessModule:
        'このモジュールは @Service の状態クラスを持たない。状態でないものは state の外 (ドメイン層) へ置く',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { Program: (node) => audit(context, services, node) };
  },
});
