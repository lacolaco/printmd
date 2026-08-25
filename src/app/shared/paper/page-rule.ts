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

  /** @page 内の var() は互換性が不確かなため、規則ごと実寸で書き直す */
  apply(paper: PaperFormat): void {
    const { width, height, margin } = paper.page;
    this.element().textContent = `@page { size: ${width}mm ${height}mm; margin: ${margin}mm; }`;
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
