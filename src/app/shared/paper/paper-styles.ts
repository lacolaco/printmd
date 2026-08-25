import { CssVariables } from './css-variables';
import { PageRule } from './page-rule';
import type { PaperFormat } from './paper-format';

/** 書式を文書へ反映する口。画面と紙で同じ寸法を見せることがページ割り一致の前提になる */
export class PaperStyles {
  private readonly variables: CssVariables;
  private readonly rule: PageRule;

  constructor(doc: Document) {
    this.variables = new CssVariables(doc);
    this.rule = new PageRule(doc);
  }

  /** 現在の書式を画面と紙の双方へ反映する */
  apply(paper: PaperFormat): void {
    this.variables.apply(paper);
    this.rule.apply(paper);
  }
}
