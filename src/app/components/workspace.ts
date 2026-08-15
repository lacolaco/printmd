import { Component } from '@angular/core';
import { ControlPanel } from './control-panel';
import { Preview } from './preview';

/** 作業画面。紙面プレビューと調整パネルの 2 カラムレイアウトの所有者 */
@Component({
  selector: 'app-workspace',
  imports: [ControlPanel, Preview],
  host: { class: 'flex min-h-0 flex-col md:flex-row' },
  template: `
    <main class="min-h-0 min-w-0 flex-1" aria-label="紙面プレビュー">
      <app-preview class="block h-full" />
    </main>
    <app-control-panel />
  `,
})
export class Workspace {}
