import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noExposedState } from './no-exposed-state';

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

tester.run('no-exposed-state', noExposedState, {
  valid: [
    {
      name: 'ステート以外のサービスは protected でも許可',
      code: `import { Component, inject } from '@angular/core';
import { Editor } from './editor';
@Component({ template: '' })
export class Panel {
  protected readonly editor = inject(Editor);
}`,
    },
    {
      name: 'コンポーネント同居のローカルステートは protected でも許可',
      code: `import { Component, inject } from '@angular/core';
import { PanelState } from './panel.state';
@Component({ template: '' })
export class Panel {
  protected readonly local = inject(PanelState);
}`,
    },
    {
      name: 'コンポーネント以外のクラスは対象外',
      code: `import { Service, inject } from '@angular/core';
import { ManuscriptState } from '../state/manuscript.state';
@Service()
export class Editor {
  readonly manuscripts = inject(ManuscriptState);
}`,
    },
  ],
  invalid: [
    {
      name: 'private でもグローバルステートの注入は禁止',
      code: `import { Component, inject } from '@angular/core';
import { DocumentState } from '../../state/document.state';
@Component({ template: '' })
export class Preview {
  private readonly documents = inject(DocumentState);
}`,
      errors: [{ messageId: 'exposedState' }],
    },
    {
      name: 'protected でのグローバルステート注入は禁止',
      code: `import { Component, inject } from '@angular/core';
import { DocumentState } from '../../state/document.state';
@Component({ template: '' })
export class Preview {
  protected readonly documents = inject(DocumentState);
}`,
      errors: [{ messageId: 'exposedState' }],
    },
    {
      name: '既定 (public) でのグローバルステート注入は禁止',
      code: `import { Component, inject } from '@angular/core';
import { ManuscriptState } from './state/manuscript.state';
@Component({ template: '' })
export class App {
  readonly manuscripts = inject(ManuscriptState);
}`,
      errors: [{ messageId: 'exposedState' }],
    },
  ],
});
