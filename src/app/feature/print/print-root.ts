import { Component, ElementRef, effect, inject } from '@angular/core';
import { PrintRootViewModel } from './print-root.vm';

/**
 * 印刷対象。印刷エンジンに渡される唯一の変換済み文書の実体をそのまま掲示する
 * (クローンしない)。
 * 画面では非表示で、@media print でのみ可視化される (styles.css の .print-root)。
 * 強制改ページのクラスは掲示時にここで反映する。掲示先は不可視で
 * レイアウト読みもないため素の effect でよい
 */
@Component({
  selector: 'app-print-root',
  providers: [PrintRootViewModel],
  host: { class: 'print-root' },
  template: '',
})
export class PrintRoot {
  private readonly vm = inject(PrintRootViewModel);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const doc = this.vm.rendered();
      const breakIds = this.vm.breakIds();
      this.host.nativeElement.replaceChildren();
      doc?.mount(this.host.nativeElement, breakIds);
    });
  }
}
