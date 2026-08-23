import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noPrivateComponentMethods } from './no-private-component-methods';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('no-private-component-methods', noPrivateComponentMethods, {
  valid: [
    {
      name: 'コンポーネントの protected ハンドラは許可',
      code: `declare function Component(config: object): ClassDecorator;
@Component({})
export class Panel {
  protected close(): void {}
}`,
    },
    {
      name: 'コンポーネントの private フィールドは許可 (メソッドだけが対象)',
      code: `declare function Component(config: object): ClassDecorator;
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
      code: `declare function Component(config: object): ClassDecorator;
@Component({})
export class Panel {
  private prepare(): void {}
}`,
      errors: [{ messageId: 'noPrivateMethod' }],
    },
    {
      name: 'コンポーネントの # メソッドも禁止',
      code: `declare function Component(config: object): ClassDecorator;
@Component({})
export class Panel {
  #prepare(): void {}
}`,
      errors: [{ messageId: 'noPrivateMethod' }],
    },
  ],
});
