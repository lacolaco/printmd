import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noNewInComponentProps } from './no-new-in-component-props';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('no-new-in-component-props', noNewInComponentProps, {
  valid: [
    {
      name: 'inject によるプロパティ初期化は許可',
      code: `import { Component, inject } from '@angular/core';
declare class Store {}
@Component({})
export class Panel {
  private readonly store = inject(Store);
}`,
    },
    {
      name: '遅延生成 (関数の中の new) は初期化ではないため許可',
      code: `import { Component } from '@angular/core';
declare class Helper {}
@Component({})
export class Panel {
  protected make = (): Helper => new Helper();
}`,
    },
    {
      name: 'コンポーネントでないクラスのプロパティ初期化の new は許可',
      code: `declare class Helper {}
export class Engine {
  private readonly helper = new Helper();
}`,
    },
  ],
  invalid: [
    {
      name: 'コンポーネントのプロパティ初期化での new は禁止',
      code: `import { Component } from '@angular/core';
declare class Helper {}
@Component({})
export class Panel {
  protected readonly helper = new Helper();
}`,
      errors: [{ messageId: 'noNewInProps' }],
    },
    {
      name: '式の内側の new も禁止',
      code: `import { Component } from '@angular/core';
declare class Helper {}
@Component({})
export class Panel {
  protected readonly helpers = [new Helper()];
}`,
      errors: [{ messageId: 'noNewInProps' }],
    },
  ],
});
