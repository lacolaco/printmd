import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { isAngularComponent } from '../support/angular-utils';
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

function enclosing(
  property: TSESTree.PropertyDefinition,
): TSESTree.ClassDeclaration | TSESTree.ClassExpression {
  return property.parent.parent as TSESTree.ClassDeclaration | TSESTree.ClassExpression;
}

function audit(context: Context, services: Services, node: TSESTree.NewExpression): void {
  const { parent } = node;
  const owner = ownerOf(parent);
  condemn(context, node, owner !== undefined && isAngularComponent(services, enclosing(owner)));
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
