import { Service, effect, signal } from '@angular/core';
import { FALLBACK, PAPERS } from './paper-catalog';
import { PaperStyles } from './paper-styles';
import type { PaperFormat } from './paper-format';

/**
 * 用紙書式の選択。現在の書式を保有し、画面 CSS と印刷規則へ反映する。
 * 紙面の寸法を要する導出 (ページ組・表示倍率・シート描画) はこの書式を源とする
 */
@Service()
export class Paper {
  private readonly selected = signal<PaperFormat>(FALLBACK);
  private readonly styles = new PaperStyles(document);

  /** 現在の用紙書式 */
  readonly format = this.selected.asReadonly();
  /** 選べる用紙書式の一覧 */
  readonly formats: readonly PaperFormat[] = PAPERS;

  /** ここは DOM 書き込みのみ (画面 CSS と @page 規則の同期) */
  private readonly restyle = effect(() => this.styles.apply(this.format()));

  /** ページ組の実測は版面の CSS 変数に依存する。初回だけは effect の flush を待たない */
  constructor() {
    this.styles.apply(this.format());
  }

  /** id で用紙書式を選び直す。未知の id は既定へ倒す */
  selectById(id: string): void {
    this.selected.set(this.formats.find((paper) => paper.id === id) ?? FALLBACK);
  }
}
