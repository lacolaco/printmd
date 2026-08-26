import { Component, inject } from '@angular/core';
import { Toolbar as NgToolbar } from '@angular/aria/toolbar';
import { ToolbarViewModel } from './toolbar.vm';
import { PaperControl } from './paper-control';
import { ZoomControl } from './zoom-control';

/**
 * 表示操作の帯。帯そのものが ngToolbar で、頁数 (非対話) / 用紙書式 / 表示倍率の
 * 操作をすべて widget として登録する
 */
@Component({
  selector: 'app-toolbar',
  imports: [NgToolbar, PaperControl, ZoomControl],
  providers: [ToolbarViewModel],
  template: `
    <div
      class="app-toolbar flex min-h-10 flex-wrap items-center gap-3 border-b px-2 py-1 text-xs sm:px-4"
      ngToolbar
      aria-label="表示設定"
    >
      <span role="status" aria-live="polite" class="whitespace-nowrap">{{ vm.status() }}</span>
      <div class="separator w-px self-stretch bg-current opacity-20" role="separator"></div>
      <app-paper-control [(selected)]="vm.format" />
      <div class="separator w-px self-stretch bg-current opacity-20" role="separator"></div>
      <app-zoom-control
        [label]="vm.zoomLabel()"
        [isShrinkable]="vm.isShrinkable()"
        [isGrowable]="vm.isGrowable()"
        (shrink)="vm.stepBy(-1)"
        (grow)="vm.stepBy(1)"
      />
    </div>
  `,
})
export class Toolbar {
  protected readonly vm = inject(ToolbarViewModel);
}
