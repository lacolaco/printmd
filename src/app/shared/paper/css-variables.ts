import type { PaperFormat } from './paper-format';

/** 画面 CSS が読む紙面の寸法。html のカスタムプロパティとして置く */
export class CssVariables {
  constructor(private readonly doc: Document) {}

  /** 現在の書式の寸法を書き込む */
  apply(paper: PaperFormat): void {
    const { style } = this.doc.documentElement;
    paper.variables().forEach(([name, value]) => style.setProperty(name, value));
  }
}
