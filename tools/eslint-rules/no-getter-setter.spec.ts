import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noGetterSetter } from './no-getter-setter';

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

tester.run('no-getter-setter', noGetterSetter, {
  valid: [
    {
      name: '振る舞いを持つメソッドは許可',
      code: `export class Cart {
  private items: string[] = [];
  addItem(item: string): void {
    this.items.push(item);
  }
}`,
    },
    {
      name: 'ブール型フィールドの get アクセサは例外として許可',
      code: `export class Door {
  private opened = false;
  get isOpen(): boolean {
    return this.opened;
  }
}`,
    },
    {
      name: 'ブール型を扱う setXxx メソッドは例外として許可',
      code: `export class Door {
  private opened = false;
  setOpen(open: boolean): void {
    this.opened = open;
  }
}`,
    },
    {
      name: 'get で始まらない類似名 (getterLike など) は対象外',
      code: `export class Box {
  getterLike(): number {
    return 1;
  }
}`,
    },
  ],
  invalid: [
    {
      name: '構文レベルの get アクセサは禁止',
      code: `export class Box {
  private width = 1;
  get size(): number {
    return this.width;
  }
}`,
      errors: [{ messageId: 'noGetterSetter' }],
    },
    {
      name: '構文レベルの set アクセサは禁止',
      code: `export class Box {
  private width = 1;
  set size(value: number) {
    this.width = value;
  }
}`,
      errors: [{ messageId: 'noGetterSetter' }],
    },
    {
      name: 'getXxx メソッドによるカプセル化も禁止',
      code: `export class Box {
  private width = 1;
  getWidth(): number {
    return this.width;
  }
}`,
      errors: [{ messageId: 'noGetterSetter' }],
    },
    {
      name: 'setXxx メソッドによるカプセル化も禁止',
      code: `export class Box {
  private width = 1;
  setWidth(value: number): void {
    this.width = value;
  }
}`,
      errors: [{ messageId: 'noGetterSetter' }],
    },
  ],
});
