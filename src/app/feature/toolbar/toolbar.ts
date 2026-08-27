import { Component, inject } from '@angular/core';
import { Toolbar as AriaToolbar } from '@angular/aria/toolbar';
import { FontSizeControl } from './font-size-control';
import { PaperControl } from './paper-control';
import { ToolbarViewModel } from './toolbar.vm';
import { ZoomControl } from './zoom-control';

/** プレビュー直上の表示操作の帯: 頁数 / 用紙 / 文字サイズ / 表示倍率 */
@Component({
  selector: 'app-toolbar',
  imports: [AriaToolbar, FontSizeControl, PaperControl, ZoomControl],
  providers: [ToolbarViewModel],
  host: { class: 'shrink-0' },
  template: `
    <div
      class="app-toolbar flex min-h-9 flex-wrap items-center justify-center gap-1.5 border-b px-2 py-1 text-xs whitespace-nowrap sm:gap-2 sm:px-4"
    >
      <span role="status" aria-live="polite">{{ vm.status() }}</span>
      <span aria-hidden="true" class="opacity-40">|</span>
      <!-- select は自前で矢印キーを使うため、ロービング focus のツールバーの外に置く -->
      <app-paper-control [(selected)]="vm.format" />
      <span aria-hidden="true" class="opacity-40">|</span>
      <div class="flex items-center gap-2" ngToolbar aria-label="表示設定">
        <app-font-size-control />
        <span aria-hidden="true" class="opacity-40">|</span>
        <app-zoom-control
          [label]="vm.zoomLabel()"
          [isShrinkable]="vm.isShrinkable()"
          [isGrowable]="vm.isGrowable()"
          (shrink)="vm.stepBy(-1)"
          (grow)="vm.stepBy(1)"
        />
      </div>
    </div>
  `,
})
export class Toolbar {
  protected readonly vm = inject(ToolbarViewModel);
}
