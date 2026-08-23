/** 配列に要素があるか。「呼び出すか渡すか」の規律で length アクセスを局所化する */
export function isNonEmpty(items: readonly unknown[]): boolean {
  return items.length > 0;
}

/** 値が undefined でなければ関数を適用する。if を唯一の文とする分岐の共有形 */
export function ifDefined<T>(value: T | undefined, use: (value: T) => void): void {
  if (value !== undefined) {
    use(value);
  }
}

/** ドロップやファイル選択の FileList を、null / undefined を吸収して配列へそろえる */
export function fromFileList(files: FileList | null | undefined): readonly File[] {
  return files === null || files === undefined ? [] : [...files];
}
