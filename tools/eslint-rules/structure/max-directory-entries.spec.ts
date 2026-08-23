import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { maxDirectoryEntries } from './max-directory-entries';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

function scratch(count: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'printmd-dir-rule-'));
  for (let index = 0; index < count; index++) {
    fs.writeFileSync(path.join(dir, `file-${index}.ts`), 'export {};\n');
  }
  fs.writeFileSync(path.join(dir, 'file-0.spec.ts'), 'export {};\n');
  return dir;
}

const smallDir = scratch(3);
const bigDir = scratch(5);

tester.run('max-directory-entries', maxDirectoryEntries, {
  valid: [
    {
      name: '上限以内のディレクトリは許可 (spec は数えない)',
      code: 'export {};',
      filename: path.join(smallDir, 'file-0.ts'),
      options: [{ maxEntries: 3 }],
    },
  ],
  invalid: [
    {
      name: '上限を超えるディレクトリは禁止',
      code: 'export {};',
      filename: path.join(bigDir, 'file-0.ts'),
      options: [{ maxEntries: 3 }],
      errors: [{ messageId: 'tooManyEntries' }],
    },
  ],
});
