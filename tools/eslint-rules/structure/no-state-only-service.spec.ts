import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noStateOnlyService } from './no-state-only-service';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts', 'src/app/components/*.ts'],
      },
      tsconfigRootDir: __dirname,
    },
  },
});

tester.run('no-state-only-service', noStateOnlyService, {
  valid: [
    {
      name: '状態と操作を併せ持つドメインサービスは許可',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Manuscripts {
  private readonly list = signal<readonly string[]>([]);
  readonly files = this.list.asReadonly();
  remove(name: string): void {
    this.list.set(this.files().filter((f) => f !== name));
  }
}`,
    },
    {
      name: 'resource は自走するため操作なしでも許可',
      code: `import { Service, computed, resource } from '@angular/core';
@Service()
export class Doc {
  private readonly pipeline = resource({ loader: () => Promise.resolve(1) });
  readonly total = computed(() => this.pipeline.value() ?? 0);
}`,
    },
    {
      name: 'コンポーネント同居のビューモデルは許可',
      filename: 'src/app/components/b.vm.ts',
      code: `import { Injectable, computed, signal } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly opened = signal(false);
  readonly label = computed(() => (this.opened() ? '開' : '閉'));
  toggle(): void {
    this.opened.update((open) => !open);
  }
}`,
    },
    {
      name: 'デコレータのないクラスは対象外',
      filename: 'ranges.ts',
      code: `export class Ranges {
  readonly values: number[] = [];
}`,
    },
  ],
  invalid: [
    {
      name: '操作のない状態だけのサービスは禁止',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class CounterHolder {
  readonly count = signal(0);
}`,
      errors: [{ messageId: 'stateOnly' }],
    },
    {
      name: 'providedIn 付き @Injectable はグローバル扱いで State クラスを禁止',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class CounterState {
  readonly count = signal(0);
  bump(): void {
    this.count.update((v) => v + 1);
  }
}`,
      errors: [{ messageId: 'globalState' }],
    },
    {
      name: 'グローバルな State クラスは禁止',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class ZoomState {
  readonly step = signal(0);
  stepBy(): void {
    this.step.update((v) => v + 1);
  }
}`,
      errors: [{ messageId: 'globalState' }],
    },
    {
      name: 'ビューモデルの形でない @Injectable は禁止',
      filename: 'src/app/components/c.ts',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class Panel {
  readonly opened = signal(false);
  toggle(): void {
    this.opened.update((open) => !open);
  }
}`,
      errors: [{ messageId: 'vmShape' }],
    },
    {
      name: 'ViewModel と名乗ってもファイルが *.vm.ts でなければ禁止',
      filename: 'src/app/components/c.ts',
      code: `import { Injectable, computed } from '@angular/core';
@Injectable()
export class PanelViewModel {
  readonly label = computed(() => '');
}`,
      errors: [{ messageId: 'vmShape' }],
    },
  ],
});
