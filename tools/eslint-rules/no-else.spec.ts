import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noElse } from './no-else';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('no-else', noElse, {
  valid: [
    {
      name: 'else の無い if は許可',
      code: `declare function f(): void;
function run(flag: boolean) {
  if (flag) {
    f();
  }
}`,
    },
    {
      name: '条件演算子は対象外',
      code: `function pick(flag: boolean): number {
  return flag ? 1 : 2;
}`,
    },
    {
      name: '外部データ型のチェックは disable コメントで理由を明記して除外できる',
      code: `declare function a(): void; declare function b(): void;
function dispatch(input: string) {
  // eslint-disable-next-line @rule-tester/no-else -- 外部データ型 (ユーザー入力) のチェック
  if (input === 'a') {
    a();
  } else {
    b();
  }
}`,
    },
  ],
  invalid: [
    {
      name: 'if と else の併用を検出する',
      code: `declare function f(): void; declare function g(): void;
function run(flag: boolean) {
  if (flag) {
    f();
  } else {
    g();
  }
}`,
      errors: [{ messageId: 'noElse' }],
    },
    {
      name: 'else if の連鎖も else の使用として検出する',
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
      errors: [{ messageId: 'noElse' }, { messageId: 'noElse' }],
    },
  ],
});
