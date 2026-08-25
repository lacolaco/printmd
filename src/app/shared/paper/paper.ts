import { DOCUMENT, Service, effect, inject, signal } from '@angular/core';
import { DEFAULT_PAPER } from './paper-catalog';
import { PaperStyles } from './paper-styles';
import type { PaperFormat } from './paper-format';

/**
 * 用紙書式の選択。現在の書式を保有し、画面 CSS と印刷規則へ反映する。
 * 紙面の寸法を要する導出 (ページ組・表示倍率・シート描画) はこの書式を源とする
 */
@Service()
export class Paper {
  private readonly styles = new PaperStyles(inject(DOCUMENT));

  /** 現在の用紙書式。Signal Forms の模型として書き込みも受ける */
  readonly format = signal<PaperFormat>(DEFAULT_PAPER);
  constructor() {
    // ここは DOM 書き込みのみ (画面 CSS と @page 規則の同期)
    effect(() => this.styles.apply(this.format()));
  }

  /** 用紙書式を選び直す */
  select(paper: PaperFormat): void {
    this.format.set(paper);
  }
}
