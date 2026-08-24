import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { vmSignature } from './vm-signature';

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

tester.run('vm-signature', vmSignature, {
  valid: [
    {
      name: 'Signal の query と void / Promise<void> の command は許可',
      code: `import { Injectable, type Signal, computed, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  private readonly opened = signal(false);
  readonly sheetOpen: Signal<boolean> = this.opened.asReadonly();
  readonly label: Signal<string> = computed(() => (this.opened() ? '開' : '閉'));
  toggle(): void {
    this.opened.update((open) => !open);
  }
  save(): Promise<void> {
    return Promise.resolve();
  }
}`,
    },
    {
      name: 'WritableSignal の明示公開は許可',
      code: `import { Injectable, type WritableSignal, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly draft: WritableSignal<string> = signal('');
  clear(): void {
    this.draft.set('');
  }
}`,
    },
    {
      name: 'private メンバーは対象外',
      code: `import { Injectable, type Signal, computed, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  private readonly opened = signal(false);
  private stash(): boolean {
    return this.opened();
  }
  readonly view: Signal<boolean> = computed(() => this.opened());
}`,
    },
    {
      name: 'ViewModel 以外のクラスは対象外',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Zoom {
  readonly step = signal(0);
  isSteppable(): boolean {
    return true;
  }
}`,
    },
  ],
  invalid: [
    {
      name: '型注釈の無い query は禁止',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly opened = signal(false);
}`,
      errors: [{ messageId: 'querySignature' }],
    },
    {
      name: 'readonly でない query は禁止',
      code: `import { Injectable, type Signal, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  opened: Signal<boolean> = signal(false).asReadonly();
}`,
      errors: [{ messageId: 'querySignature' }],
    },
    {
      name: 'Signal 以外の型の query は禁止',
      code: `import { Injectable } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly total: number = 0;
}`,
      errors: [{ messageId: 'querySignature' }],
    },
    {
      name: '値を返す command は禁止',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  private readonly count = signal(0);
  bump(): number {
    this.count.update((v) => v + 1);
    return this.count();
  }
}`,
      errors: [{ messageId: 'commandSignature' }],
    },
    {
      name: '返り値型の無い command は禁止',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  private readonly count = signal(0);
  bump() {
    this.count.update((v) => v + 1);
  }
}`,
      errors: [{ messageId: 'commandSignature' }],
    },
  ],
});
