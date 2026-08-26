import { Component, inject } from '@angular/core';
import { HeaderViewModel } from './header.vm';

/** アプリヘッダ。ロゴと印刷の終端動作だけを持つ 1 本の帯 */
@Component({
  selector: 'app-header',
  providers: [HeaderViewModel],
  template: `
    <header
      class="app-header flex min-h-12 shrink-0 items-center gap-2 border-b px-2 py-1 sm:h-12 sm:gap-3 sm:py-0 sm:px-4"
    >
      <h1 class="app-logo text-base font-bold tracking-tight">printmd</h1>
      @if (vm.isActive()) {
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
