import { Component, input } from '@angular/core';
import { Toolbar } from '@angular/aria/toolbar';
import { PageStatus } from './page-status';
import { ZoomControl } from './zoom-control';

/**
 * アプリヘッダ。ロゴ / 表示状態 (頁数・ズーム) / 印刷の終端動作を持つ 1 本の帯
 */
@Component({
  selector: 'app-header',
  imports: [Toolbar, PageStatus, ZoomControl],
  template: `
    <header class="app-header flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <h1 class="app-logo text-base font-bold tracking-tight">printmd</h1>
      @if (active()) {
        <div
          class="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-stone-700"
          ngToolbar
          aria-label="表示操作"
        >
          <app-page-status />
          <span aria-hidden="true" class="opacity-40">|</span>
          <app-zoom-control />
        </div>
        <button
          type="button"
          class="app-print-button ml-auto rounded-sm px-3 py-1 text-xs font-medium"
          (click)="print()"
        >
          印刷 (PDFに保存)
        </button>
      }
    </header>
  `,
})
export class Header {
  /** 表示操作と印刷を出すか。原稿の有無の判断は親 (App) が持つ */
  readonly active = input(false);

  protected print(): void {
    window.print();
  }
}
