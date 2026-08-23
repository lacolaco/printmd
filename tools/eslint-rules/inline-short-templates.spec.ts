import * as path from 'node:path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { inlineShortTemplates } from './inline-short-templates';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const fixturesDir = path.join(__dirname, 'fixtures');
const inFixtures = (name: string) => path.join(fixturesDir, name);

const tester = new RuleTester();

const component = (props: string) => `
const Component = (o) => (c) => c;
@Component({
  ${props}
})
export class Probe {}
`;

tester.run('inline-short-templates', inlineShortTemplates, {
  valid: [
    {
      name: '閾値を超える外部テンプレートは許可する',
      filename: inFixtures('probe.ts'),
      code: component(`templateUrl: './long.html'`),
    },
    {
      name: '参照先が存在しない場合は関与しない (コンパイラの責務)',
      filename: inFixtures('probe.ts'),
      code: component(`templateUrl: './missing.html'`),
    },
    {
      name: 'Component デコレータの外の templateUrl プロパティは対象外',
      filename: inFixtures('probe.ts'),
      code: `export const config = { templateUrl: './short.html' };`,
    },
    {
      name: 'maxLines オプションで閾値を下げられる (3 行 > maxLines 2)',
      filename: inFixtures('probe.ts'),
      code: component(`templateUrl: './medium.html'`),
      options: [{ maxLines: 2 }],
    },
  ],
  invalid: [
    {
      name: '閾値以下の外部テンプレートを検出し、インライン template へ autofix する',
      filename: inFixtures('probe.ts'),
      code: component(`templateUrl: './short.html'`),
      errors: [{ messageId: 'inline' }],
      output: component('template: `\n    <p>短い {{ value }}</p>\n  `'),
    },
    {
      name: 'maxLines オプションで閾値を上げれば超過していたテンプレートも検出する',
      filename: inFixtures('probe.ts'),
      code: component(`templateUrl: './medium.html'`),
      options: [{ maxLines: 5 }],
      errors: [{ messageId: 'inline' }],
      output: component('template: `\n    <p>1</p>\n    <p>2</p>\n    <p>3</p>\n  `'),
    },
  ],
});
