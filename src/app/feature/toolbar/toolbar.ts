import { Component, inject } from '@angular/core';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { FontSizeControl } from './font-size-control';
import { PaperControl } from './paper-control';
import { ToolbarViewModel } from './toolbar.vm';
import { ZoomControl } from './zoom-control';

/** プレビュー直上の表示操作の帯: 頁数 / 用紙 / 文字サイズ / 倍率 */
@Component({
  selector: 'app-toolbar',
  imports: [AriaToolbar, FontSizeControl, PaperControl, ZoomControl],
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
      <app-paper-control [(selected)]="vm.format" />
      <span aria-hidden="true" class="opacity-40">|</span>
      <app-font-size-control [(selected)]="vm.fontSize" />
      <span aria-hidden="true" class="opacity-40">|</span>
      <app-zoom-control [(selected)]="vm.zoomIndex" />
    </div>
  `,
})
export class Toolbar {
  protected readonly vm = inject(ToolbarViewModel);
}
