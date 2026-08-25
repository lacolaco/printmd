import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import { enclosingClass, isDecorated } from '../support/angular-utils';

type MessageIds = 'missingDoc';

type Context = Parameters<Parameters<typeof ESLintUtils.RuleCreator.withoutDocs>[0]['create']>[0];

type Services = ReturnType<typeof ESLintUtils.getParserServices>;

type Member = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

function isHidden(member: Member): boolean {
  const { accessibility, key } = member;
  return accessibility === 'private' || key.type === 'PrivateIdentifier';
}

function isDocumented(context: Context, member: Member): boolean {
  const { sourceCode } = context;
  const comments = sourceCode.getCommentsBefore(member);
  return comments.some((c) => c.type === 'Block' && c.value.startsWith('*'));
}

function isProvided(services: Services, cls: ReturnType<typeof enclosingClass>): boolean {
  return isDecorated(services, cls, 'Service') || isDecorated(services, cls, 'Injectable');
}

function isExposed(services: Services, member: Member): boolean {
  return isProvided(services, enclosingClass(member)) && !isHidden(member);
}

function onMethod(context: Context, services: Services, member: TSESTree.MethodDefinition): void {
  const { kind } = member;
  const target = kind !== 'constructor' && isExposed(services, member);
  condemn(context, member, target && !isDocumented(context, member));
}

function onProp(context: Context, services: Services, member: TSESTree.PropertyDefinition): void {
  condemn(context, member, isExposed(services, member) && !isDocumented(context, member));
}

function condemn(context: Context, member: Member, violated: boolean): void {
  if (violated) {
    const { key } = member;
    context.report({ node: key, messageId: 'missingDoc' });
  }
}

/**
 * DI で提供されるクラス (@Service / @Injectable) の非 private メンバーには
 * JSDoc を必須とする。公開面は目的が読める形で提供する
 */
export const injectableJsdoc = ESLintUtils.RuleCreator.withoutDocs<[], MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      missingDoc: '@Service / @Injectable の公開メンバーには JSDoc で目的を書く',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    return {
      MethodDefinition: (node) => onMethod(context, services, node),
      PropertyDefinition: (node) => onProp(context, services, node),
    };
  },
});
