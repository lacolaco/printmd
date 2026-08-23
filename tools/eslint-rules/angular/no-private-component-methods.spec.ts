import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noPrivateComponentMethods } from './no-private-component-methods';

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

tester.run('no-private-component-methods', noPrivateComponentMethods, {
  valid: [
    {
      name: 'コンポーネントの protected ハンドラは許可',
      code: `import { Component } from '@angular/core';
@Component({})
export class Panel {
  protected close(): void {}
}`,
    },
    {
      name: '@angular/core 以外の Component デコレータは対象外',
      code: `import { Component } from 'my-lib';
@Component({})
export class Panel {
  private prepare(): void {}
}`,
    },
    {
      name: 'コンポーネントの private フィールドは許可 (メソッドだけが対象)',
      code: `import { Component } from '@angular/core';
@Component({})
export class Panel {
  private readonly count = 0;
}`,
    },
    {
      name: 'コンポーネントでないクラスの private メソッドは許可',
      code: `export class Engine {
  run(): void {
    this.spin();
  }
  private spin(): void {}
}`,
    },
  ],
  invalid: [
    {
      name: 'コンポーネントの private メソッドは禁止',
      code: `import { Component } from '@angular/core';
@Component({})
export class Panel {
  private prepare(): void {}
}`,
      errors: [{ messageId: 'noPrivateMethod' }],
    },
    {
      name: 'コンポーネントの # メソッドも禁止',
      code: `import { Component } from '@angular/core';
@Component({})
export class Panel {
  #prepare(): void {}
}`,
      errors: [{ messageId: 'noPrivateMethod' }],
    },
    {
      name: '名前空間 import 経由の Component でも禁止',
      code: `import * as core from '@angular/core';
@core.Component({})
export class Panel {
  private prepare(): void {}
}`,
      errors: [{ messageId: 'noPrivateMethod' }],
    },
    {
      name: 'private なアロー関数フィールドによる回避も禁止',
      code: `import { Component } from '@angular/core';
@Component({})
export class Panel {
  private prepare = (): void => {};
}`,
      errors: [{ messageId: 'noPrivateMethod' }],
    },
  ],
});
