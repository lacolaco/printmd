import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
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

  /** デザイン案の切り替え (チケット 22 の意思決定用。決定後に除去する) */
  protected readonly designOptions = [
    { id: 'a', label: '案A 朱' },
    { id: 'b', label: '案B 青焼' },
    { id: 'c', label: '案C 原版' },
  ] as const;
  protected readonly design = signal(
    new URLSearchParams(window.location.search).get('design') ?? 'a',
  );

  constructor() {
    document.documentElement.dataset['design'] = this.design();
    // 印刷対象は唯一のマスター要素そのもの (クローンしない)。@media print でのみ可視化する
    effect(() => {
      const master = this.store.printableMaster();
      const host = this.printRoot().nativeElement;
      host.replaceChildren();
      if (master !== null) host.append(master.container);
    });
  }

  protected print(): void {
    window.print();
  }
}
