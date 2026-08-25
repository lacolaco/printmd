import { Component, inject } from '@angular/core';
import { Toolbar } from '@angular/aria/toolbar';
import { HeaderViewModel } from './header.vm';
import { ZoomControl } from './zoom-control';

/**
 * アプリヘッダ。ロゴ / 表示状態 (頁数・ズーム) / 印刷の終端動作を持つ 1 本の帯
 */
@Component({
  selector: 'app-header',
  imports: [Toolbar, ZoomControl],
  providers: [HeaderViewModel],
  template: `
    <header class="app-header flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <h1 class="app-logo text-base font-bold tracking-tight">printmd</h1>
      @if (vm.active()) {
        <div
          class="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-stone-700"
          ngToolbar
          aria-label="表示操作"
        >
          <span role="status" aria-live="polite">{{ vm.status() }}</span>
          <span aria-hidden="true" class="opacity-40">|</span>
          <app-zoom-control
            [label]="vm.zoomLabel()"
            [shrinkable]="vm.shrinkable()"
            [growable]="vm.growable()"
            (shrink)="vm.stepBy(-1)"
            (grow)="vm.stepBy(1)"
          />
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
  protected readonly vm = inject(HeaderViewModel);

  protected print(): void {
    window.print();
  }
}
