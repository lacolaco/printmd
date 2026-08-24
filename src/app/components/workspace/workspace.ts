import { Component, inject } from '@angular/core';
import { BreakPanel } from './control-panel/break-panel/break-panel';
import { FilePanel } from './control-panel/file-panel/file-panel';
import { Preview } from './preview/preview';
import { WorkspaceViewModel } from './workspace.vm';

/**
 * 作業画面。デスクトップ (md+) は紙面 + 右カラムの 2 カラム、
 * スマートフォン幅はシングルカラムで、調整パネルを画面下部の
 * 折りたたみボトムシートとして重ねる (開閉状態はこの画面が所有する)
 */
@Component({
  selector: 'app-workspace',
  imports: [BreakPanel, FilePanel, Preview],
  providers: [WorkspaceViewModel],
  host: { class: 'relative flex min-h-0 md:flex-row' },
  template: `
    <main class="min-h-0 min-w-0 flex-1" aria-label="紙面プレビュー">
      <app-preview class="block h-full" />
    </main>
    <div class="max-md:fixed max-md:inset-x-0 max-md:bottom-7 max-md:z-20 md:contents">
      <button
        type="button"
        class="sheet-handle flex w-full items-center justify-center gap-2 border-t py-2 text-sm font-medium md:hidden"
        [attr.aria-expanded]="vm.sheetOpen()"
        aria-controls="control-panel-sheet"
        (click)="vm.toggle()"
      >
        調整パネル
        <span aria-hidden="true">{{ vm.sheetOpen() ? '▾' : '▴' }}</span>
      </button>
      <aside
        id="control-panel-sheet"
        class="app-panel block w-full shrink-0 overflow-y-auto p-4 max-md:max-h-[60vh] max-md:shadow-2xl md:w-90 md:border-l"
        [class]="{ 'max-md:hidden': !vm.sheetOpen() }"
        aria-label="調整パネル"
      >
        <app-file-panel />
        <app-break-panel />
      </aside>
    </div>
  `,
})
export class Workspace {
  protected readonly vm = inject(WorkspaceViewModel);
}
