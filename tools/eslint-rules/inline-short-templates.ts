import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Rule } from 'eslint';
import { maxLinesOption } from './options';

const DEFAULT_MAX_LINES = 20;

/** @Component デコレータの引数オブジェクト直下の templateUrl だけを対象にするセレクタ */
const TEMPLATE_URL_SELECTOR =
  'Decorator > CallExpression[callee.name="Component"] > ObjectExpression > Property[key.name="templateUrl"]';

function tryReadFile(file: string): string | null {
  try {
    return fs.readFileSync(file, 'utf-8').replace(/\n$/, '');
  } catch {
    return null;
  }
}

function readTemplateFile(context: Rule.RuleContext, templateUrl: string): string | null {
  const file = path.resolve(path.dirname(context.filename), templateUrl);
  return tryReadFile(file);
}

function escapeForTemplateLiteral(content: string): string {
  return content.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

/** プロパティのインデント (既定 2) に合わせて本文を 1 段深く敷き直す */
function buildInlineTemplateBody(content: string, escaped: string, column: number): string {
  if (content.trim() === '') return '';
  const indent = ' '.repeat(column + 2);
  return `\n${indent}${escaped.split('\n').join(`\n${indent}`)}\n${' '.repeat(column)}`;
}

function indentColumnOf(node: Rule.Node): number {
  return node.loc?.start.column ?? 2;
}

function toInlineTemplateFix(fixer: Rule.RuleFixer, node: Rule.Node, content: string): Rule.Fix {
  const column = indentColumnOf(node);
  const escaped = escapeForTemplateLiteral(content);
  const body = buildInlineTemplateBody(content, escaped, column);
  return fixer.replaceText(node, `template: \`${body}\``);
}

function lineCountOf(content: string): number {
  return content.split('\n').length;
}

function reportIfShortEnough(
  context: Rule.RuleContext,
  maxLines: number,
  node: Rule.Node,
  content: string,
): void {
  const lines = lineCountOf(content);
  if (lines > maxLines) return;
  const data = { lines: String(lines), max: String(maxLines) };
  const fix: Rule.ReportFixer = (fixer) => toInlineTemplateFix(fixer, node, content);
  context.report({ node, messageId: 'inline', data, fix });
}

function templateUrlOf(node: Rule.Node): string | null {
  if (node.type !== 'Property') return null;
  const value = node.value;
  return value.type === 'Literal' && typeof value.value === 'string' ? value.value : null;
}

function checkTemplateUrl(context: Rule.RuleContext, maxLines: number, node: Rule.Node): void {
  const templateUrl = templateUrlOf(node);
  if (templateUrl === null) return;
  const content = readTemplateFile(context, templateUrl);
  if (content === null) return;
  reportIfShortEnough(context, maxLines, node, content);
}

/**
 * templateUrl の参照先の行数を実測し、閾値以下ならインライン template を要求する。
 * 閾値はオプション { maxLines } で変えられる (既定 20)
 */
export const inlineShortTemplates: Rule.RuleModule = {
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
  create(context) {
    const maxLines = maxLinesOption(context, DEFAULT_MAX_LINES);
    return {
      [TEMPLATE_URL_SELECTOR]: (node: Rule.Node) => checkTemplateUrl(context, maxLines, node),
    };
  },
};
