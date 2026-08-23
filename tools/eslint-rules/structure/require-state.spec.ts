import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { requireState } from './require-state';

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

tester.run('require-state', requireState, {
  valid: [
    {
      name: '@Service のストアを持つモジュールは許可',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class CounterStore {
  readonly count = signal(0);
}`,
    },
  ],
  invalid: [
    {
      name: 'signal を使っていてもストアでないクラスは禁止',
      code: `import { computed, signal } from '@angular/core';
export class Gauge {
  private readonly index = signal(0);
  readonly value = computed(() => this.index());
}`,
      errors: [{ messageId: 'statelessModule' }],
    },
    {
      name: 'ストアを持たないモジュールは禁止',
      code: `export function pure(): number {
  return 1;
}`,
      errors: [{ messageId: 'statelessModule' }],
    },
  ],
});
