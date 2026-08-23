import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noClassInheritance } from './no-class-inheritance';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

tester.run('no-class-inheritance', noClassInheritance, {
  valid: [
    {
      name: 'インタフェースの実装 (implements) は許可',
      code: `interface Runner {
  run(): void;
}
class TaskRunner implements Runner {
  run(): void {}
}`,
    },
    {
      name: 'インタフェース同士の継承は許可',
      code: `interface Base {
  id: string;
}
interface Extended extends Base {
  name: string;
}`,
    },
    {
      name: '継承の無いクラスは許可',
      code: `class Standalone {
  value = 1;
}`,
    },
  ],
  invalid: [
    {
      name: 'クラスからの継承は禁止',
      code: `class Base {
  value = 1;
}
class Derived extends Base {}`,
      errors: [{ messageId: 'noExtends' }],
    },
    {
      name: '抽象クラスからの継承も禁止',
      code: `abstract class Base {
  abstract run(): void;
}
class Derived extends Base {
  run(): void {}
}`,
      errors: [{ messageId: 'noExtends' }],
    },
    {
      name: 'クラス式の継承も禁止',
      code: `class Base {}
const derived = class extends Base {};`,
      errors: [{ messageId: 'noExtends' }],
    },
  ],
});
