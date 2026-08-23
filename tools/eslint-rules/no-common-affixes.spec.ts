import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noCommonAffixes } from './no-common-affixes';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('no-common-affixes', noCommonAffixes, {
  valid: [
    {
      name: '共通の接頭辞・接尾辞を持たないメンバーは許可',
      code: `export class Timer {
  start(): void {
    this.begin();
  }
  private begin(): void {}
}`,
    },
    {
      name: '単一語の名前は接辞を持たないため対象外',
      code: `export class Store {
  load(): void {}
  loadAll(): void {}
}`,
    },
    {
      name: 'マーカー接頭辞 on / is は検査対象にしない',
      code: `export class Panel {
  onClick(): void {}
  onFocus(): void {}
  isOpen(): boolean {
    return true;
  }
  isValid(): boolean {
    return true;
  }
}`,
    },
    {
      name: 'スコープが異なれば同じ接頭辞でも許可',
      code: `export function first(): string {
  const pageCount = 1;
  return String(pageCount);
}
export function second(): string {
  const pageIndex = 2;
  return String(pageIndex);
}`,
    },
  ],
  invalid: [
    {
      name: '同一クラスで接頭辞を共有するメソッドは禁止',
      code: `export class Screen {
  timerStart(): void {}
  timerStop(): void {}
}`,
      errors: [
        { messageId: 'commonAffix', data: { affix: 'timer' } },
        { messageId: 'commonAffix', data: { affix: 'timer' } },
      ],
    },
    {
      name: 'マーカー接頭辞の次の語が実質の接頭辞になる (onFooXxx の Foo)',
      code: `export class Screen {
  onTimerStart(): void {}
  onTimerStop(): void {}
}`,
      errors: [
        { messageId: 'commonAffix', data: { affix: 'timer' } },
        { messageId: 'commonAffix', data: { affix: 'timer' } },
      ],
    },
    {
      name: '同一クラスで接尾辞を共有するフィールドは禁止',
      code: `export class Layout {
  private readonly headerHeight = 1;
  private readonly footerHeight = 2;
  total(): number {
    return this.headerHeight + this.footerHeight;
  }
}`,
      errors: [
        { messageId: 'commonAffix', data: { affix: 'height' } },
        { messageId: 'commonAffix', data: { affix: 'height' } },
      ],
    },
    {
      name: '同一スコープで接頭辞を共有する変数は禁止',
      code: `export function summarize(): number {
  const pageCount = 1;
  const pageIndex = 2;
  return pageCount + pageIndex;
}`,
      errors: [
        { messageId: 'commonAffix', data: { affix: 'page' } },
        { messageId: 'commonAffix', data: { affix: 'page' } },
      ],
    },
    {
      name: 'モジュール直下で接頭辞を共有する関数は禁止',
      code: `export function accountDeposit(): void {}
export function accountWithdraw(): void {}`,
      errors: [
        { messageId: 'commonAffix', data: { affix: 'account' } },
        { messageId: 'commonAffix', data: { affix: 'account' } },
      ],
    },
  ],
});
