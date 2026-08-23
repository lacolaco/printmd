import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { ifOnlyAtStart } from './if-only-at-start';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('if-only-at-start', ifOnlyAtStart, {
  valid: [
    {
      name: '規律の修正後コード: if が関数の唯一の文',
      code: `declare function isPrime(n: number): boolean; declare function log(n: number): void;
function reportIfPrime(n: number) {
  if (isPrime(n)) {
    log(n);
  }
}`,
    },
    {
      name: 'else / else-if の連鎖は先頭の if の一部として許可',
      code: `declare function f(): void; declare function g(): void; declare function h(): void;
function dispatch(kind: string) {
  if (kind === 'a') {
    f();
  } else if (kind === 'b') {
    g();
  } else {
    h();
  }
}`,
    },
    {
      name: 'if の無い関数は文が何個あってもよい',
      code: `declare function f(): number; declare function g(n: number): void;
function run() {
  const n = f();
  g(n);
}`,
    },
    {
      name: '入れ子の関数はそれ自身が単位 (コールバックの先頭の唯一の if は許可)',
      code: `declare function each(cb: (n: number) => void): void; declare function g(n: number): void;
function run() {
  each((n) => {
    if (n > 0) {
      g(n);
    }
  });
}`,
    },
  ],
  invalid: [
    {
      name: '規律の禁止例: ループの中の if',
      code: `declare function isPrime(n: number): boolean; declare function log(n: number): void;
function reportPrimes(n: number) {
  for (let i = 2; i < n; i++) {
    if (isPrime(i)) {
      log(i);
    }
  }
}`,
      errors: [{ messageId: 'notAtStart' }],
    },
    {
      name: '別の文の後にある if',
      code: `declare function f(): number; declare function g(): void;
function run() {
  const n = f();
  if (n > 0) {
    g();
  }
}`,
      errors: [{ messageId: 'notAtStart' }],
    },
    {
      name: '先頭にあっても後続の文がある関数 (if がある関数は他のことをしない)',
      code: `declare function g(): void; declare function h(): void;
function run(flag: boolean) {
  if (flag) {
    g();
  }
  h();
}`,
      errors: [{ messageId: 'notAtStart' }],
    },
    {
      name: 'if の中の if (else-if ではない入れ子)',
      code: `declare function g(): void;
function run(a: boolean, b: boolean) {
  if (a) {
    if (b) {
      g();
    }
  }
}`,
      errors: [{ messageId: 'notAtStart' }],
    },
  ],
});
