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

/** 利用者が選んだ File。プラットフォーム型を構造的一致で流さず、適合を宣言して包む */
export class PickedFile implements ImportSource {
  readonly name: string;

  constructor(private readonly file: File) {
    this.name = file.name;
  }

  text(): Promise<string> {
    return this.file.text();
  }
}

/** ドロップやファイル選択の FileList を、null / undefined を吸収して取り込み入力へそろえる */
export function sourcesFrom(files: FileList | null | undefined): readonly ImportSource[] {
  const picked = files === null || files === undefined ? [] : [...files];
  return picked.map((file) => new PickedFile(file));
}
