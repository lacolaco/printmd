import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { stateOwnership } from './state-ownership';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts', 'src/app/state/*.ts', 'src/app/components/*.ts'],
      },
      tsconfigRootDir: __dirname,
    },
  },
});

tester.run('state-ownership', stateOwnership, {
  valid: [
    {
      name: 'signal を保有する @Service は state/ の *.state.ts で許可',
      filename: 'src/app/state/a.state.ts',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class CounterState {
  readonly count = signal(0);
}`,
    },
    {
      name: 'linkedSignal を保有する @Service も状態保有と認める',
      filename: 'src/app/state/a.state.ts',
      code: `import { Service, linkedSignal, signal } from '@angular/core';
@Service()
export class MarkState {
  private readonly source = signal(0);
  readonly marks = linkedSignal(() => this.source());
}`,
    },
    {
      name: 'signal を保有する @Injectable はコンポーネント同居の *.state.ts で許可',
      filename: 'src/app/components/b.state.ts',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class PanelState {
  readonly opened = signal(false);
}`,
    },
    {
      name: '状態を保有しない導出サービスは State と名乗らなければ許可',
      filename: 'src/app/components/c.ts',
      code: `import { Service, computed } from '@angular/core';
@Service()
export class Paginator {
  readonly total = computed(() => 0);
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
      name: '導出だけのローカルステートも State と名乗れない',
      filename: 'src/app/components/b.state.ts',
      code: `import { Injectable, computed } from '@angular/core';
@Injectable()
export class HeaderState {
  readonly label = computed(() => '');
}`,
      errors: [{ messageId: 'derivedState' }],
    },
    {
      name: '導出だけのグローバルなクラスは State と名乗れない',
      filename: 'src/app/state/a.state.ts',
      code: `import { Service, computed } from '@angular/core';
@Service()
export class PaginationState {
  readonly total = computed(() => 0);
}`,
      errors: [{ messageId: 'derivedState' }],
    },
    {
      name: '状態を保有する @Service は state/ の外に置けない',
      filename: 'src/app/components/c.ts',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class ZoomState {
  readonly step = signal(0);
}`,
      errors: [{ messageId: 'globalMisplaced' }],
    },
    {
      name: 'state/ にあってもファイル名が *.state.ts でなければ禁止',
      filename: 'src/app/state/zoom.ts',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class ZoomState {
  readonly step = signal(0);
}`,
      errors: [{ messageId: 'globalMisplaced' }],
    },
    {
      name: '状態を保有する @Service は State と名乗らなければならない',
      filename: 'src/app/state/a.state.ts',
      code: `import { Service, signal } from '@angular/core';
@Service()
export class Zoom {
  readonly step = signal(0);
}`,
      errors: [{ messageId: 'globalMisplaced' }],
    },
    {
      name: '状態を保有する @Injectable は *.state.ts に置かなければならない',
      filename: 'src/app/components/c.ts',
      code: `import { Injectable, signal } from '@angular/core';
@Injectable()
export class PanelState {
  readonly opened = signal(false);
}`,
      errors: [{ messageId: 'localMisplaced' }],
    },
  ],
});
