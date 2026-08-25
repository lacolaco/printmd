/** 取り込み入力。File と同じ形の最小面 (名前と本文の遅延読み出し) */
export interface ImportSource {
  readonly name: string;
  text(): Promise<string>;
}

/** 利用者が選んだ File を ImportSource として包む */
export class PickedFile implements ImportSource {
  readonly name: string;

  constructor(private readonly file: File) {
    this.name = file.name;
  }

  text(): Promise<string> {
    return this.file.text();
  }
}

export function sourcesFrom(files: FileList | null | undefined): readonly ImportSource[] {
  const picked = files === null || files === undefined ? [] : [...files];
  return picked.map((file) => new PickedFile(file));
}
