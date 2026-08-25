import type { PaperFormat } from './paper-format';

/** @page 規則を載せる style 要素の目印 */
const MARK = 'data-paper-page-rule';

function marked(style: HTMLStyleElement): HTMLStyleElement {
  style.setAttribute(MARK, '');
  return style;
}

/**
 * 書式を文書へ書き込む口。画面 CSS (カスタムプロパティ) と印刷 (@page 規則) の
 * 双方へ同じ書式を反映することが、プレビューと印刷のページ割り一致の前提になる
 */
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

  /** 差し替え可能な Document を扱うため、判定に realm 依存の instanceof を使わない */
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
