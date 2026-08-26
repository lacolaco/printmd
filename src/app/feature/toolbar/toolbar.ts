import { Component, inject } from '@angular/core';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { PAPERS } from '../../shared/paper/paper-catalog';
import { SIZES } from '../../shared/typography/font-catalog';
import { StepControl } from './step-control';
import { ToolbarViewModel } from './toolbar.vm';
import { ZOOMS } from '../../shared/pagination/zoom';

/** プレビュー直上の表示操作の帯: 頁数 / 用紙 / 文字サイズ / 倍率 */
@Component({
  selector: 'app-toolbar',
  imports: [AriaToolbar, StepControl],
  providers: [ToolbarViewModel],
  host: { class: 'shrink-0' },
  template: `
    <div
      ngToolbar
      aria-label="表示設定"
      class="app-toolbar flex min-h-9 flex-wrap items-center gap-2 border-b px-2 py-1 text-xs sm:gap-3 sm:px-4"
    >
      <span role="status" aria-live="polite">{{ vm.status() }}</span>
      <span aria-hidden="true" class="opacity-40">|</span>
      <app-step-control name="用紙" [steps]="papers" [(selected)]="vm.format" />
      <span aria-hidden="true" class="opacity-40">|</span>
      <app-step-control name="文字" [steps]="sizes" [(selected)]="vm.fontSize" />
      <span aria-hidden="true" class="opacity-40">|</span>
      <app-step-control name="倍率" [steps]="zooms" [(selected)]="vm.zoomLevel" />
    </div>
  `,
})
export class Toolbar {
  protected readonly vm = inject(ToolbarViewModel);
  protected readonly papers = PAPERS;
  protected readonly sizes = SIZES;
  protected readonly zooms = ZOOMS;
}
