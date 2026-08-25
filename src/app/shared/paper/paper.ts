import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { DEFAULT_PAPER, PAPERS } from './paper-catalog';
import { PaperStyles } from './paper-styles';
import type { PaperFormat } from './paper-format';

/**
 * 用紙書式の選択。現在の書式を保有し、画面 CSS と印刷規則へ反映する。
 * 紙面の寸法を要する導出 (ページ組・表示倍率・シート描画) はこの書式を源とする
 */
@Service()
export class Paper {
  private readonly selected = signal<PaperFormat>(DEFAULT_PAPER);
  private readonly styles = new PaperStyles(inject(DOCUMENT));

  /** 現在の用紙書式 */
  readonly format = this.selected.asReadonly();
  /** 選べる用紙書式の一覧 */
  readonly formats: readonly PaperFormat[] = PAPERS;

  constructor() {
    this.styles.apply(this.format());
  }

  /**
   * id で用紙書式を選び直す (未知の id は既定へ倒す)。
   * 実測が版面の CSS 変数を前提にするため、状態より先に反映を書く
   */
  selectById(id: string): void {
    const chosen = this.formats.find((paper) => paper.id === id) ?? DEFAULT_PAPER;
    this.styles.apply(chosen);
    this.selected.set(chosen);
  }
}
