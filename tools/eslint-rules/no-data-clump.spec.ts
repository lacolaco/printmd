import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noDataClump } from './no-data-clump';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: { allowDefaultProject: ['*.ts'] },
      tsconfigRootDir: __dirname,
    },
  },
});

tester.run('no-data-clump', noDataClump, {
  valid: [
    {
      name: 'モジュール内の型を受け取る関数が 1 つだけなら許可',
      code: `interface Point {
  x: number;
}
export function shift(point: Point): number {
  return point.x + 1;
}`,
    },
    {
      name: 'クラスのメソッドとして振る舞いを持つ型は対象外',
      code: `export class Counter {
  private total = 0;

  bump(): void {
    this.total += 1;
  }

  current(): number {
    return this.total;
  }
}`,
    },
    {
      name: 'オブジェクト形でない型別名 (関数型など) は対象外',
      code: `type Callback = (x: number) => void;
export function runA(cb: Callback): void {
  cb(1);
}
export function runB(cb: Callback): void {
  cb(2);
}`,
    },
    {
      name: '外部の型 (組み込み・import) の受け回しは対象外',
      code: `export function first(items: readonly string[]): string {
  return items[0];
}
export function last(items: readonly string[]): string {
  return items[items.length - 1];
}`,
    },
  ],
  invalid: [
    {
      name: 'モジュール内の型を 2 つ以上の関数が引数で受け回したら違反 (赤線は型宣言名)',
      code: `interface Tally {
  total: number;
}
export function bump(tally: Tally): void {
  tally.total += 1;
}
export function current(tally: Tally): number {
  return tally.total;
}`,
      errors: [{ messageId: 'dataClump', line: 1, column: 11, endColumn: 16 }],
    },
    {
      name: '配列や readonly 修飾で受け回しても違反',
      code: `interface Row {
  depth: number;
}
export function deepest(rows: readonly Row[]): number {
  return Math.max(...rows.map((row) => row.depth));
}
export function shallowest(rows: readonly Row[]): number {
  return Math.min(...rows.map((row) => row.depth));
}`,
      errors: [{ messageId: 'dataClump', line: 1, column: 11, endColumn: 14 }],
    },
  ],
});
