import { Component, inject } from '@angular/core';
import { Toolbar } from '@angular/aria/toolbar';
import { HeaderViewModel } from './header.vm';
import { PaperControl } from './paper-control';
import { ZoomControl } from './zoom-control';

/**
 * アプリヘッダ。ロゴ / 表示状態 (頁数・用紙・ズーム) / 印刷の終端動作を持つ 1 本の帯
 */
@Component({
  selector: 'app-header',
  imports: [PaperControl, Toolbar, ZoomControl],
  providers: [HeaderViewModel],
  template: `
    <header
      class="app-header flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b px-2 py-1 sm:h-12 sm:gap-3 sm:py-0 sm:px-4"
    >
      <h1 class="app-logo text-base font-bold tracking-tight">printmd</h1>
      @if (vm.isActive()) {
        <div
          class="flex min-w-fit flex-1 items-center justify-center gap-1.5 text-xs whitespace-nowrap text-stone-700 sm:gap-2 md:absolute md:left-1/2 md:flex-none md:-translate-x-1/2"
        >
          <span role="status" aria-live="polite">{{ vm.status() }}</span>
          <span aria-hidden="true" class="hidden opacity-40 sm:inline">|</span>
          <!-- select は自前で矢印キーを使うため、ロービング focus のツールバーの外に置く -->
          <app-paper-control [(selected)]="vm.format" />
          <span aria-hidden="true" class="hidden opacity-40 sm:inline">|</span>
          <div class="flex items-center gap-2" ngToolbar aria-label="表示倍率">
            <app-zoom-control
              [label]="vm.zoomLabel()"
              [isShrinkable]="vm.isShrinkable()"
              [isGrowable]="vm.isGrowable()"
              (shrink)="vm.stepBy(-1)"
              (grow)="vm.stepBy(1)"
            />
          </div>
        </div>
        <button
          type="button"
          class="app-print-button ml-auto rounded-sm px-3 py-1 text-xs font-medium"
          (click)="print()"
        >
          印刷
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
