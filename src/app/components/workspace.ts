import { Component, signal } from '@angular/core';
import { ControlPanel } from './control-panel';
import { Preview } from './preview';

/**
 * 作業画面。デスクトップ (md+) は紙面 + 右カラムの 2 カラム、
 * スマートフォン幅はシングルカラムで、調整パネルを画面下部の
 * 折りたたみボトムシートとして重ねる (開閉状態はこの画面が所有する)
 */
@Component({
  selector: 'app-workspace',
  imports: [ControlPanel, Preview],
  host: { class: 'relative flex min-h-0 md:flex-row' },
  template: `
    <main class="min-h-0 min-w-0 flex-1" aria-label="紙面プレビュー">
      <app-preview class="block h-full" />
    </main>
    <div class="max-md:fixed max-md:inset-x-0 max-md:bottom-7 max-md:z-20 md:contents">
      <button
        type="button"
        class="sheet-handle flex w-full items-center justify-center gap-2 border-t py-2 text-sm font-medium md:hidden"
        [attr.aria-expanded]="sheetOpen()"
        aria-controls="control-panel-sheet"
        (click)="sheetOpen.set(!sheetOpen())"
      >
        調整パネル
        <span aria-hidden="true">{{ sheetOpen() ? '▾' : '▴' }}</span>
      </button>
      <app-control-panel
        id="control-panel-sheet"
        class="max-md:max-h-[60vh] max-md:shadow-2xl"
        [class]="{ 'max-md:hidden': !sheetOpen() }"
      />
    </div>
  `,
})
export class Workspace {
  protected readonly sheetOpen = signal(false);
}
