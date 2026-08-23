import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { pureConditions } from './pure-conditions';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('pure-conditions', pureConditions, {
  valid: [
    {
      name: '問い合わせ (has / includes / 比較) は許可',
      code: `function f(xs: Set<string>, key: string): string {
  return xs.has(key) ? 'yes' : 'no';
}`,
    },
    {
      name: '条件の外の変更系呼び出しは対象外',
      code: `function f(xs: string[], x: string): number {
  xs.push(x);
  return xs.length;
}`,
    },
    {
      name: '純粋な関数呼び出しは許可',
      code: `declare function isPrime(n: number): boolean;
function f(n: number): string {
  return isPrime(n) ? 'prime' : 'composite';
}`,
    },
  ],
  invalid: [
    {
      name: '条件式での変更系メソッド (delete) は禁止',
      code: `declare function g(): void;
function f(xs: Set<string>, key: string): void {
  if (!xs.delete(key)) {
    g();
  }
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
    {
      name: '三項演算子の条件でも禁止 (pop)',
      code: `function f(xs: number[]): number {
  return xs.pop() !== undefined ? 1 : 0;
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
    {
      name: 'while 条件のイテレータ next も禁止',
      code: `declare function use(v: number): void;
function f(it: Iterator<number>): void {
  while (!it.next().done) {
    use(0);
  }
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
    {
      name: '条件内の代入は禁止',
      code: `declare function g(): number;
function f(): void {
  let x = 0;
  for (; (x = g()) > 0; ) {
    x;
  }
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
    {
      name: '条件内のインクリメントは禁止',
      code: `function f(n: number): void {
  let i = 0;
  while (i++ < n) {
    i;
  }
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
    {
      name: '非決定的な呼び出し (Math.random) は禁止',
      code: `declare function g(): void;
function f(): void {
  if (Math.random() > 0.5) {
    g();
  }
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
    {
      name: '条件内のコールバックの中の変更も検出する',
      code: `declare function g(): void;
function f(xs: number[][], v: number): void {
  if (xs.some((row) => row.push(v) > 0)) {
    g();
  }
}`,
      errors: [{ messageId: 'impureCondition' }],
    },
  ],
});
