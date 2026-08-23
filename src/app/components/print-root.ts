import { Component, ElementRef, effect, inject } from '@angular/core';
import { applyForcedBreaks, type RenderedDocument } from '../markdown/block-extractor';
import { EditorStore } from '../state/editor-store';

/**
 * 印刷対象。印刷エンジンに渡される唯一の変換済み文書の実体をそのまま掲示する
 * (クローンしない)。
 * 画面では非表示で、@media print でのみ可視化される (styles.css の .print-root)。
 * 強制改ページのクラスは掲示時にここで反映する。掲示先は不可視で
 * レイアウト読みもないため素の effect でよい
 */
@Component({
  selector: 'app-print-root',
  host: { class: 'print-root' },
  template: '',
})
export class PrintRoot {
  private readonly store = inject(EditorStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const host = this.host.nativeElement;
      resetHost(host);
      mountDocument(host, this.store.renderedDocument(), this.store.breaks());
    });
  }
}

function mountDocument(
  host: HTMLElement,
  doc: RenderedDocument | null,
  breaks: ReadonlySet<string>,
): void {
  if (doc !== null) {
    applyForcedBreaks(doc.container, doc.blocks, breaks);
    host.append(doc.container);
  }
}

function resetHost(host: HTMLElement): void {
  host.replaceChildren();
}
