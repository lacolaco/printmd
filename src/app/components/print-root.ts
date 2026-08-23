import { Component, ElementRef, effect, inject } from '@angular/core';
import { applyForcedBreaks, type RenderedDocument } from '../markdown/block-extractor';
import { BreakState } from '../state/break-state';
import { DocumentState } from '../state/document-state';

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
  private readonly documents = inject(DocumentState);
  private readonly marks = inject(BreakState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const host = this.host.nativeElement;
      resetHost(host);
      mountDocument(host, this.documents.renderedDocument(), this.marks.breaks());
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
