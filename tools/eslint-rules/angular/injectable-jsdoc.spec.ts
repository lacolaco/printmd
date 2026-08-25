import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { injectableJsdoc } from './injectable-jsdoc';

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

tester.run('injectable-jsdoc', injectableJsdoc, {
  valid: [
    {
      name: 'JSDoc 付きの公開メンバーは許可',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Manuscripts {
  private readonly list = signal<readonly string[]>([]);

  /** 原稿ファイル列 */
  readonly files = this.list.asReadonly();

  /** 末尾の原稿を除く */
  remove(): void {
    this.list.set(this.files().slice(0, -1));
  }
}`,
    },
    {
      name: 'private メンバーと constructor は対象外',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Zoom {
  private readonly step = signal(0);

  private tally(): number {
    return this.step();
  }

  /** 段を進める */
  stepBy(): void {
    this.step.update((v) => v + 1);
  }
}`,
    },
    {
      name: 'デコレータの無いクラスは対象外',
      code: `export class Ranges {
  readonly values: number[] = [];
}`,
    },
  ],
  invalid: [
    {
      name: '@Injectable でも JSDoc の無い公開メンバーは違反',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly isOpened = signal(false);
}`,
      errors: [{ messageId: 'missingDoc' }],
    },
    {
      name: 'JSDoc の無い公開フィールドは違反',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Manuscripts {
  readonly files = signal<readonly string[]>([]);
}`,
      errors: [{ messageId: 'missingDoc' }],
    },
    {
      name: 'JSDoc の無い公開メソッドは違反',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Zoom {
  private readonly step = signal(0);

  stepBy(): void {
    this.step.update((v) => v + 1);
  }
}`,
      errors: [{ messageId: 'missingDoc' }],
    },
    {
      name: '行コメントは JSDoc と見なさない',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Zoom {
  // 段
  readonly step = signal(0);
}`,
      errors: [{ messageId: 'missingDoc' }],
    },
  ],
});
