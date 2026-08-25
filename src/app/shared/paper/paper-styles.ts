import type { PaperFormat } from './paper-format';

/** @page 規則を載せる style 要素の目印 */
const MARK = 'data-paper-page-rule';

function marked(style: HTMLStyleElement): HTMLStyleElement {
  style.setAttribute(MARK, '');
  return style;
}

/** 書式を文書へ書き込む口。画面と紙で同じ寸法を見せることがページ割り一致の前提になる */
export class PaperStyles {
  constructor(private readonly doc: Document) {}

  /** 現在の書式を画面と紙の双方へ反映する */
  apply(paper: PaperFormat): void {
    this.paint(paper);
    this.stamp(paper);
  }

  private stamp(paper: PaperFormat): void {
    this.sheetRule().textContent = paper.pageRule();
  }

  private paint(paper: PaperFormat): void {
    const { style } = this.doc.documentElement;
    paper.variables().forEach(([name, value]) => style.setProperty(name, value));
  }

  private sheetRule(): HTMLStyleElement {
    const found = this.doc.head.querySelector<HTMLStyleElement>(`style[${MARK}]`);
    return found ?? this.mount();
  }

  private mount(): HTMLStyleElement {
    const style = this.doc.createElement('style');
    this.doc.head.append(style);
    return marked(style);
  }
}
