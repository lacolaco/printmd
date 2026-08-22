import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Rule } from 'eslint';

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

function toInlineTemplateFix(fixer: Rule.RuleFixer, node: Rule.Node, content: string): Rule.Fix {
  const column = node.loc?.start.column ?? 2;
  const escaped = escapeForTemplateLiteral(content);
  const body = buildInlineTemplateBody(content, escaped, column);
  return fixer.replaceText(node, `template: \`${body}\``);
}

function buildReportDescriptor(
  node: Rule.Node,
  data: { lines: string; max: string },
  fix: Rule.ReportFixer,
): Rule.ReportDescriptor {
  return { node, messageId: 'inline', data, fix };
}

function reportIfShortEnough(
  context: Rule.RuleContext,
  maxLines: number,
  node: Rule.Node,
  content: string,
): void {
  const lines = content.split('\n').length;
  if (lines > maxLines) return;
  const data = { lines: String(lines), max: String(maxLines) };
  const fix: Rule.ReportFixer = (fixer) => toInlineTemplateFix(fixer, node, content);
  context.report(buildReportDescriptor(node, data, fix));
}

function checkTemplateUrl(context: Rule.RuleContext, maxLines: number, node: Rule.Node): void {
  if (node.type !== 'Property') return;
  if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') return;
  const content = readTemplateFile(context, node.value.value);
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
    const options = (context.options[0] ?? {}) as { maxLines?: number };
    const maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
    return {
      [TEMPLATE_URL_SELECTOR]: (node: Rule.Node) => checkTemplateUrl(context, maxLines, node),
    };
  },
};
