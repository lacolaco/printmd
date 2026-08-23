import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';
import { callOrPass } from './call-or-pass';

(RuleTester as unknown as { describe: unknown; it: unknown }).describe = describe;
(RuleTester as unknown as { describe: unknown; it: unknown }).it = it;

const tester = new RuleTester({
  languageOptions: { parser: tseslint.parser, sourceType: 'module' },
});

tester.run('call-or-pass', callOrPass, {
  valid: [
    {
      name: '渡すだけの関数は許可 (規律の修正後コード)',
      code: `declare function sum(a: number[]): number; declare function size(a: number[]): number;
function average(arr: number[]) {
  return sum(arr) / size(arr);
}`,
    },
    {
      name: 'メンバーアクセスだけの関数は許可',
      code: `function names(items: { name: string }[]) {
  return items.map((item) => item.name).join(', ');
}`,
    },
    {
      name: '別々の変数なら渡すものとアクセスするものが同居してよい',
      code: `declare function store(x: unknown): void;
function f(a: number[], b: number[]) {
  store(a);
  return b.length;
}`,
    },
    {
      name: 'メンバーアクセスの結果を渡すのは「渡す」に当たらない',
      code: `declare function g(x: number): void;
function f(a: number[]) {
  g(a.length);
  return a.map((x) => x);
}`,
    },
    {
      name: '変数自体を関数として呼ぶのはどちらでもない',
      code: `declare function h(cb: () => void): void;
function f(cb: () => void) {
  cb();
  h(cb);
}`,
    },
    {
      name: '分割代入で取り出してから渡すのは公認の逃し方',
      code: `declare function h(el: unknown, tag: string): void;
function f(el: HTMLElement) {
  const { tagName } = el;
  h(el, tagName);
}`,
    },
    {
      name: 'ローカル変数もどちらか一方なら許可',
      code: `declare function make(): { run(): void };
function f() {
  const runner = make();
  runner.run();
}`,
    },
  ],
  invalid: [
    {
      name: '規律の禁止例: 渡し (sum(arr)) とアクセス (arr.length) の両方',
      code: `declare function sum(a: number[]): number;
function average(arr: number[]) {
  return sum(arr) / arr.length;
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: 'メソッド呼び出しと引数渡しの両方',
      code: `declare function g(a: number[]): void;
function f(a: number[]) {
  a.sort();
  g(a);
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: 'スプレッドで渡すのも「渡す」に当たる',
      code: `declare function h(...xs: number[]): void;
function f(a: number[]) {
  h(...a);
  return a.length;
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: '入れ子のコールバック内の使用も同じ変数として数える',
      code: `declare function g(a: number[], x: number): void;
function f(a: number[]) {
  return a.map((x: number) => g(a, x));
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: '非 null アサーション越しの使用も同じ変数として数える',
      code: `declare function g(a: unknown): void;
function f(a: { bar(): void } | undefined) {
  a!.bar();
  g(a!);
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: 'as アサーション越しの使用も同じ変数として数える',
      code: `declare function h(a: unknown): void;
function f(a: unknown) {
  void (a as string[]).length;
  h(a);
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: 'catch 節の変数も対象',
      code: `declare function report(e: unknown): void; declare function log(m: string): void;
function f() {
  try {
    log('x');
  } catch (e) {
    log((e as Error).message);
    report(e);
  }
}`,
      errors: [{ messageId: 'both' }],
    },
    {
      name: 'ローカル変数でも両方は違反',
      code: `declare function make(): { run(): void }; declare function stop(r: unknown): void;
function f() {
  const runner = make();
  runner.run();
  stop(runner);
}`,
      errors: [{ messageId: 'both' }],
    },
  ],
});
