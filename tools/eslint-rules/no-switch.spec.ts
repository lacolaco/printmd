import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noSwitch } from './no-switch';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('no-switch', noSwitch, {
  valid: [
    {
      name: 'default 無し + 全 case return の switch は許可',
      code: `type Kind = 'a' | 'b';
function label(kind: Kind): string {
  switch (kind) {
    case 'a':
      return 'A';
    case 'b':
      return 'B';
  }
}`,
    },
    {
      name: 'fallthrough でまとめた case は、最後の case が return すれば許可',
      code: `type Kind = 'a' | 'b' | 'c';
function label(kind: Kind): string {
  switch (kind) {
    case 'a':
    case 'b':
      return 'AB';
    case 'c':
      return 'C';
  }
}`,
    },
  ],
  invalid: [
    {
      name: 'default 節は禁止',
      code: `function label(kind: string): string {
  switch (kind) {
    case 'a':
      return 'A';
    default:
      return 'other';
  }
}`,
      errors: [{ messageId: 'noDefault' }],
    },
    {
      name: 'return で終わらない case は禁止 (break)',
      code: `declare function log(s: string): void;
function report(kind: 'a' | 'b'): void {
  switch (kind) {
    case 'a':
      log('A');
      break;
    case 'b':
      log('B');
      break;
  }
}`,
      errors: [{ messageId: 'caseMustReturn' }, { messageId: 'caseMustReturn' }],
    },
    {
      name: '末尾の空 case は return に到達しないため禁止',
      code: `function label(kind: 'a' | 'b'): string | undefined {
  switch (kind) {
    case 'a':
      return 'A';
    case 'b':
  }
  return undefined;
}`,
      errors: [{ messageId: 'caseMustReturn' }],
    },
  ],
});
