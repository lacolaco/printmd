import * as fs from 'node:fs';
import * as path from 'node:path';
import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { maxLinesOption } from './options';

type MessageIds = 'inline';
type Options = [{ maxLines?: number }?];
type Context = TSESLint.RuleContext<MessageIds, Options>;

const DEFAULT_MAX_LINES = 20;

/** @Component デコレータの引数オブジェクト直下の templateUrl だけを対象にするセレクタ */
const TEMPLATE_PROPERTY_SELECTOR =
  'Decorator > CallExpression[callee.name="Component"] > ObjectExpression > Property[key.name="templateUrl"]';

function safeRead(file: string): string | null {
  try {
    return fs.readFileSync(file, 'utf-8').replace(/\n$/, '');
  } catch {
    return null;
  }
}

function loadReferenced(context: Context, templateUrl: string): string | null {
  const file = path.resolve(path.dirname(context.filename), templateUrl);
  return safeRead(file);
}

function escapeForBacktick(content: string): string {
  return content.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

/** プロパティのインデント (既定 2) に合わせて本文を 1 段深く敷き直す */
function buildBody(content: string, escaped: string, column: number): string {
  const indent = ' '.repeat(column + 2);
  const body = `\n${indent}${escaped.split('\n').join(`\n${indent}`)}\n${' '.repeat(column)}`;
  return content.trim() === '' ? '' : body;
}

function indentColumn(node: TSESTree.Node): number {
  return node.loc.start.column;
}

function toReplacement(
  fixer: TSESLint.RuleFixer,
  node: TSESTree.Node,
  content: string,
): TSESLint.RuleFix {
  const column = indentColumn(node);
  const escaped = escapeForBacktick(content);
  const body = buildBody(content, escaped, column);
  return fixer.replaceText(node, `template: \`${body}\``);
}

function lineTotal(content: string): number {
  return content.split('\n').length;
}

function reportViolation(
  context: Context,
  maxLines: number,
  node: TSESTree.Node,
  content: string,
): void {
  const lines = lineTotal(content);
  const data = { lines: String(lines), max: String(maxLines) };
  const fix: TSESLint.ReportFixFunction = (fixer) => toReplacement(fixer, node, content);
  context.report({ node, messageId: 'inline', data, fix });
}

function flagCandidate(
  context: Context,
  maxLines: number,
  node: TSESTree.Node,
  content: string | null,
): void {
  if (content !== null && lineTotal(content) <= maxLines) {
    reportViolation(context, maxLines, node, content);
  }
}

function urlOf(node: TSESTree.Node): string | null {
  const value = node.type === 'Property' ? node.value : undefined;
  const literal = value?.type === 'Literal' ? value.value : undefined;
  return typeof literal === 'string' ? literal : null;
}

function resolveContent(context: Context, node: TSESTree.Node): string | null {
  const templateUrl = urlOf(node);
  return templateUrl === null ? null : loadReferenced(context, templateUrl);
}

function checkNode(context: Context, maxLines: number, node: TSESTree.Node): void {
  flagCandidate(context, maxLines, node, resolveContent(context, node));
}

/**
 * templateUrl の参照先の行数を実測し、閾値以下ならインライン template を要求する。
 * 閾値はオプション { maxLines } で変えられる (既定 20)
 */
export const inlineShortTemplates = ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    messages: {
      inline:
        'テンプレートが {{lines}} 行 ({{max}} 行以下) のため、templateUrl ではなくインライン template にする (--fix 後は不要になった HTML ファイルを削除する)',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxLines: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context) {
    const maxLines = maxLinesOption(context, DEFAULT_MAX_LINES);
    return {
      [TEMPLATE_PROPERTY_SELECTOR]: (node: TSESTree.Node) => checkNode(context, maxLines, node),
    };
  },
});
