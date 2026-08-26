/**
 * 本文のベース文字サイズ。寸法を要する処理は段ごとに分岐せず、この型へ問い合わせる
 */
export class FontSize {
  /** 画面に出す表示名 */
  readonly label: string;

  constructor(readonly pt: number) {
    this.label = `${pt}pt`;
  }

  /** 画面 CSS が読むカスタムプロパティ (名前と値の組) */
  variables(): readonly (readonly [string, string])[] {
    return [['--base-font-size', `${this.pt}pt`]];
  }
}
