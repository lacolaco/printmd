import { DOCUMENT, Service, effect, inject, signal } from '@angular/core';
import { PAPERS } from './paper-catalog';
import { PageRule } from './page-rule';
import { StyleVariables } from '../layout/style-variables';
import type { PaperFormat } from './paper-format';

/**
 * 用紙書式の選択。現在の書式を保有し、印刷の紙寸法へ反映する。
 * 紙面の寸法を要する導出 (ページ組・表示倍率・シート描画) はこの書式を源とする。
 * 画面 CSS への寸法の書き込みは StyleVariables が行う
 */
@Service()
export class Paper {
  private readonly rule = new PageRule(inject(DOCUMENT));

  /** 現在の用紙書式。Signal Forms の模型として書き込みも受ける */
  readonly format = signal<PaperFormat>(PAPERS.initial);

  constructor() {
    inject(StyleVariables).register(() => this.format().variables());
    // ここは DOM 書き込みのみ (@page 規則の同期)
    effect(() => this.rule.apply(this.format()));
  }

  /** 用紙書式を選び直す */
  select(paper: PaperFormat): void {
    this.format.set(paper);
  }
}
