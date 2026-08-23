import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { maxFunctionLines } from './max-function-lines';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

const statements = (n: number) => Array.from({ length: n }, (_, i) => `  x = ${i};`).join('\n');

tester.run('max-function-lines', maxFunctionLines, {
  valid: [
    { name: 'ロジック 5 行の関数宣言は許可', code: `let x; function f() {\n${statements(5)}\n}` },
    {
      name: 'ロジック 5 行のメソッドは許可',
      code: `let x; class C { m() {\n${statements(5)}\n} }`,
    },
    {
      name: '入れ子の閉じ括弧だけの行は数えない (for/for/if/return/return = ちょうど 5 行)',
      code: `function f(xs: number[][]) {
  for (const row of xs) {
    for (const v of row) {
      if (v > 0) {
        return true;
      }
    }
  }
  return false;
}`,
    },
    {
      name: '複数行呼び出しの閉じ ); も数えない',
      code: `declare function g(a: () => number): void; function f() {
  g(
    () => 1,
  );
  g(
    () => 2,
  );
}`,
    },
    { name: '1 行ブロックは 1 行扱い', code: `function f() { return 1; }` },
    {
      name: 'maxLines オプションで閾値を上げられる',
      code: `let x; function f() {\n${statements(8)}\n}`,
      options: [{ maxLines: 8 }],
    },
  ],
  invalid: [
    {
      name: 'ロジック 6 行の関数宣言を検出する',
      code: `let x; function f() {\n${statements(6)}\n}`,
      errors: [{ messageId: 'tooLong' }],
    },
    {
      name: 'for や if の開始行はロジックとして数える (4 文 + for + 内側 1 文 = 6 行)',
      code: `let x; function f(xs: number[]) {
  x = 1;
  x = 2;
  x = 3;
  x = 4;
  for (const v of xs) {
    x = v;
  }
}`,
      errors: [{ messageId: 'tooLong' }],
    },
    {
      name: '式本体のアロー関数もロジック行で数える',
      code: `const f = (a: number) =>\n  a +\n  1 +\n  2 +\n  3 +\n  4 +\n  5;`,
      errors: [{ messageId: 'tooLong' }],
    },
    {
      name: 'ロジック 6 行のメソッドを検出する',
      code: `let x; class C { m() {\n${statements(6)}\n} }`,
      errors: [{ messageId: 'tooLong' }],
    },
  ],
});
