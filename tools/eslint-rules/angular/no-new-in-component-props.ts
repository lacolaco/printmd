import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import {
  enclosingClass,
  isAngularComponent,
  originOf,
  resolvedSymbol,
} from '../support/angular-utils';
import { FUNCTION_TYPES } from '../support/ast-utils';

type MessageIds = 'noNewInProps';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

/** new を包むプロパティ初期化子を探す。関数境界を跨いだら遅延生成なので対象外 */
function ownerOf(node: TSESTree.Node | null | undefined): TSESTree.PropertyDefinition | undefined {
  return node === undefined || node === null ? undefined : within(node);
}

function within(node: TSESTree.Node): TSESTree.PropertyDefinition | undefined {
  const { type } = node;
  return FUNCTION_TYPES.has(type) ? undefined : pick(node);
}

function pick(node: TSESTree.Node): TSESTree.PropertyDefinition | undefined {
  return node.type === 'PropertyDefinition' ? node : ownerOf(node.parent);
}

/** DI で受け取るべきはプロジェクト定義のクラスだけ。Set や Map などの組み込み値は対象外 */
function isProjectClass(services: Services, callee: TSESTree.Node): boolean {
  const origin = originOf(resolvedSymbol(services, callee));
  return origin !== '' && !origin.includes('node_modules');
}

function audit(context: Context, services: Services, node: TSESTree.NewExpression): void {
  const { parent, callee } = node;
  const owner = ownerOf(parent);
  const banned = owner === undefined ? false : isAngularComponent(services, enclosingClass(owner));
  condemn(context, node, banned && isProjectClass(services, callee));
}

function condemn(context: Context, node: TSESTree.NewExpression, violated: boolean): void {
  if (violated) {
    context.report({ node, messageId: 'noNewInProps' });
  }
}

/**
 * コンポーネントのプロパティ初期化で new しない。協力オブジェクトは DI
 * (providers + inject) から受け取る。関数の中の new (遅延生成) は対象外
 */
export const noNewInComponentProps = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      noNewInProps:
        'コンポーネントのプロパティ初期化で new しない。providers に登録して inject で受け取る',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return { NewExpression: (node) => audit(context, services, node) };
  },
});
