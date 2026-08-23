import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noSingleImplementationInterface } from './no-single-implementation-interface';

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

tester.run('no-single-implementation-interface', noSingleImplementationInterface, {
  valid: [
    {
      name: '実装が 2 つあるインタフェースは許可',
      code: `interface Renderer {
  render(): string;
}
export class SvgRenderer implements Renderer {
  render(): string {
    return 'svg';
  }
}
export class CanvasRenderer implements Renderer {
  render(): string {
    return 'canvas';
  }
}`,
    },
    {
      name: '実装を持たない (型としてだけ使う) インタフェースは対象外',
      code: `interface Shape {
  width: number;
}
export function area(shape: Shape): number {
  return shape.width;
}`,
    },
    {
      name: 'implements の無いクラスは対象外',
      code: `export class Standalone {
  value = 1;
}`,
    },
  ],
  invalid: [
    {
      name: '実装が 1 つしかないインタフェースは禁止 (赤線は interface 宣言名に出る)',
      code: `interface Renderer {
  render(): string;
}
export class SvgRenderer implements Renderer {
  render(): string {
    return 'svg';
  }
}`,
      errors: [{ messageId: 'singleImplementation', line: 1, column: 11, endColumn: 19 }],
    },
  ],
});
