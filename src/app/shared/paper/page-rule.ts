import type { PaperFormat } from './paper-format';

/** 規則を載せる style 要素の目印 */
const MARK = 'data-paper-page-rule';

function withMark(style: HTMLStyleElement): HTMLStyleElement {
  style.setAttribute(MARK, '');
  return style;
}

/** 印刷の紙寸法。@page 規則を現在の書式で置き換える */
export class PageRule {
  constructor(private readonly doc: Document) {}

  /** @page 規則を書式の実寸で書き直す */
  apply(paper: PaperFormat): void {
    this.element().textContent = paper.pageRule();
  }

  private element(): HTMLStyleElement {
    const found = this.doc.head.querySelector<HTMLStyleElement>(`style[${MARK}]`);
    return found ?? this.create();
  }

  private create(): HTMLStyleElement {
    const style = this.doc.createElement('style');
    this.doc.head.append(style);
    return withMark(style);
  }
}
