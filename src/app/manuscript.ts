/** 取り込んだ原稿ファイル。content は不変 (原稿は書き換えない) */
export interface ManuscriptFile {
  readonly id: number;
  readonly name: string;
  readonly content: string;
}

/** 取り込み入力。File と同じ形の最小面 (名前と本文の遅延読み出し) */
export interface ImportSource {
  readonly name: string;
  text(): Promise<string>;
}
