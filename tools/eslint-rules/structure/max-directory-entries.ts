import * as fs from 'node:fs';
import * as path from 'node:path';
import { ESLintUtils, type TSESLint } from '@typescript-eslint/utils';

type MessageIds = 'tooManyEntries';
type Options = [{ maxEntries?: number }?];
type Context = TSESLint.RuleContext<MessageIds, Options>;

/** マジカルナンバー 7±2 の上限 */
const ENTRY_LIMIT = 9;

const HEAD = { line: 1, column: 0 };

/** spec は元ファイルの影なので数えない。数えるのは TS ファイルとサブディレクトリ */
function isCounted(entry: fs.Dirent): boolean {
  const source = entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts');
  return entry.isDirectory() || source;
}

function tally(dir: string): number {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.filter(isCounted).length;
  } catch {
    return 0;
  }
}

function audit(context: Context, limit: number): void {
  const { filename } = context;
  const dir = path.dirname(filename);
  const count = tally(dir);
  flag(context, count, limit, count > limit);
}

function flag(context: Context, count: number, limit: number, violated: boolean): void {
  if (violated) {
    const data = { count: String(count), limit: String(limit) };
    context.report({ loc: HEAD, messageId: 'tooManyEntries', data });
  }
}

/**
 * ディレクトリ直下の要素数をマジカルナンバー (7±2) の上限以内に保つ。
 * 超えたらサブディレクトリへ束ねて分類する
 */
export const maxDirectoryEntries = ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  meta: {
    type: 'suggestion',
    messages: {
      tooManyEntries:
        'ディレクトリ直下に {{count}} 要素ある ({{limit}} 以内)。サブディレクトリへ束ねて分類する (マジカルナンバー)',
    },
    schema: [
      {
        type: 'object',
        properties: { maxEntries: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context) {
    const { options } = context;
    const limit = options[0]?.maxEntries ?? ENTRY_LIMIT;
    return { Program: () => audit(context, limit) };
  },
});
