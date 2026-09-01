import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { namedParamUnions } from './named-param-unions';

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

tester.run('named-param-unions', namedParamUnions, {
  valid: [
    {
      name: '名前付きの型なら許可',
      code: `import { Service } from '@angular/core';
export type Direction = -1 | 1;
@Service()
export class Zoom {
  stepBy(delta: Direction): void {
    void delta;
  }
}`,
    },
    {
      name: '単一の型は対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Breaks {
  toggle(blockId: string): void {
    void blockId;
  }
}`,
    },
    {
      name: 'private なら対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  private clamp(delta: -1 | 1): void {
    void delta;
  }
}`,
    },
    {
      name: 'ビューモデルでもサービスでもないクラスは対象外',
      code: `export class FontCatalog {
  next(delta: -1 | 1): void {
    void delta;
  }
}`,
    },
    {
      name: 'protected も公開ではないので対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  protected clamp(delta: -1 | 1): void {
    void delta;
  }
}`,
    },
    {
      name: 'private なコンストラクタ引数プロパティは対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  constructor(private readonly mode: 'a' | 'b') {}
}`,
    },
    {
      name: 'true と false の組は boolean が名前なので対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  flag(on: true | false): void {
    void on;
  }
}`,
    },
    {
      name: '省略可能を表す undefined との組は対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  select(step: number | undefined): void {
    void step;
  }
}`,
    },
    {
      name: 'null との組は対象外',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  select(step: number | null): void {
    void step;
  }
}`,
    },
  ],
  invalid: [
    {
      name: 'サービスの公開メソッドのインラインの union は禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepBy(delta: -1 | 1): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'ビューモデルの公開メソッドのインラインの union は禁止',
      code: `import { Injectable } from '@angular/core';
@Injectable()
export class ToolbarViewModel {
  stepBy(delta: -1 | 1): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '文字列リテラルの union も禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Paper {
  orient(side: 'portrait' | 'landscape'): void {
    void side;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '引数が複数あれば該当する引数ごとに報告する',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  move(delta: -1 | 1, axis: 'x' | 'y'): void {
    void delta;
    void axis;
  }
}`,
      errors: [{ messageId: 'namedUnion' }, { messageId: 'namedUnion' }],
    },
    {
      name: '既定値があっても禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepBy(delta: -1 | 1 = 1): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '可変長引数でも禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepAll(...deltas: (-1 | 1)[]): void {
    void deltas;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '括弧で包んでも禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepBy(delta: (-1 | 1) | undefined): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'providedIn 付きの Injectable も対象',
      code: `import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class Zoom {
  stepBy(delta: -1 | 1): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'オブジェクト型の中の union も禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepBy(opts: { delta: -1 | 1 }): void {
    void opts;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'タプルの中の union も禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepBy(pair: [-1 | 1, number]): void {
    void pair;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '関数型の引数の union も禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  watch(cb: (delta: -1 | 1) => void): void {
    void cb;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '入れ子の括弧で選択肢を割っても禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Paper {
  orient(side: 'portrait' | ('landscape' | undefined)): void {
    void side;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'アロー関数のプロパティでも禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  readonly stepBy = (delta: -1 | 1): void => {
    void delta;
  };
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'コンストラクタの引数も禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  constructor(delta: -1 | 1) {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '初期化子の無い関数型のプロパティも禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  declare readonly stepBy: (delta: -1 | 1) => void;
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '型引数の制約に書いても禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  pick<T extends -1 | 1>(delta: T): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: '公開のコンストラクタ引数プロパティは禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  constructor(readonly mode: 'a' | 'b') {}
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'abstract なメンバーも禁止',
      code: `import { Service } from '@angular/core';
@Service()
export abstract class Zoom {
  abstract stepBy(delta: -1 | 1): void;
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
    {
      name: 'undefined を含んでいても他が union なら禁止',
      code: `import { Service } from '@angular/core';
@Service()
export class Zoom {
  stepBy(delta: -1 | 1 | undefined): void {
    void delta;
  }
}`,
      errors: [{ messageId: 'namedUnion' }],
    },
  ],
});
