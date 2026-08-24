import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { componentBoundary } from './component-boundary';

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

tester.run('component-boundary', componentBoundary, {
  valid: [
    {
      name: 'コンポーネントの protected ハンドラと private 注入フィールドは許可',
      code: `import { Component, ElementRef, inject } from '@angular/core';
@Component({ template: '' })
export class Panel {
  private readonly host = inject(ElementRef);
  protected close(): void {}
}`,
    },
    {
      name: '自身と 1-1 対応するビューモデルの注入は許可',
      code: `import { Component, Injectable, inject, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly opened = signal(false);
  toggle(): void {
    this.opened.update((open) => !open);
  }
}
@Component({ template: '', providers: [PanelViewModel] })
export class Panel {
  protected readonly vm = inject(PanelViewModel);
}`,
    },
    {
      name: 'ElementRef などフレームワーク基盤の注入は許可',
      code: `import { Component, ElementRef, inject } from '@angular/core';
@Component({ template: '' })
export class Panel {
  private readonly host = inject(ElementRef);
}`,
    },
    {
      name: 'input/output だけのプレーンなコンポーネントは許可',
      code: `import { Component, input, output } from '@angular/core';
@Component({ template: '' })
export class Row {
  readonly label = input('');
  readonly picked = output();
}`,
    },
    {
      name: 'コンポーネント以外のクラスは対象外',
      code: `import { Injectable, Service, inject, signal } from '@angular/core';
@Service()
export class Zoom {
  readonly step = signal(0);
  stepBy(): void {
    this.step.update((v) => v + 1);
  }
}
@Injectable()
export class PanelViewModel {
  private readonly zoom = inject(Zoom);
}`,
    },
  ],
  invalid: [
    {
      name: 'コンポーネントの private メソッドは禁止',
      code: `import { Component } from '@angular/core';
@Component({ template: '' })
export class Panel {
  private tally(): number {
    return 1;
  }
}`,
      errors: [{ messageId: 'privateMethod' }],
    },
    {
      name: 'private なアロー関数フィールドも禁止',
      code: `import { Component } from '@angular/core';
@Component({ template: '' })
export class Panel {
  private readonly tally = (): number => 1;
}`,
      errors: [{ messageId: 'privateMethod' }],
    },
    {
      name: 'ドメインサービスの直接注入は禁止',
      code: `import { Component, Service, inject, signal } from '@angular/core';
@Service()
export class Manuscripts {
  readonly list = signal<readonly string[]>([]);
  clear(): void {
    this.list.set([]);
  }
}
@Component({ template: '' })
export class Panel {
  protected readonly manuscripts = inject(Manuscripts);
}`,
      errors: [{ messageId: 'foreignInject' }],
    },
    {
      name: '他コンポーネントのビューモデルの注入は禁止',
      code: `import { Component, Injectable, inject } from '@angular/core';
@Injectable()
export class OtherViewModel {}
@Component({ template: '' })
export class Panel {
  protected readonly vm = inject(OtherViewModel);
}`,
      errors: [{ messageId: 'foreignInject' }],
    },
    {
      name: 'input/output とビューモデル注入の同居は禁止',
      code: `import { Component, Injectable, inject, input } from '@angular/core';
@Injectable()
export class PanelViewModel {}
@Component({ template: '' })
export class Panel {
  readonly label = input('');
  protected readonly vm = inject(PanelViewModel);
}`,
      errors: [{ messageId: 'mixedRole' }],
    },
  ],
});
