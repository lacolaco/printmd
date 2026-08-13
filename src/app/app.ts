import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { BreakPanel } from './components/break-panel';
import { FilePanel } from './components/file-panel';
import { Preview } from './components/preview';
import { EditorStore } from './state/editor-store';

@Component({
  selector: 'app-root',
  imports: [BreakPanel, FilePanel, Preview],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(EditorStore);
  private readonly printRoot = viewChild.required<ElementRef<HTMLElement>>('printRoot');

  constructor() {
    // 印刷対象は唯一のマスター要素そのもの (クローンしない)。@media print でのみ可視化する
    effect(() => {
      const master = this.store.printableMaster();
      const host = this.printRoot().nativeElement;
      host.replaceChildren();
      if (master !== null) host.append(master);
    });
  }

  protected print(): void {
    window.print();
  }
}
