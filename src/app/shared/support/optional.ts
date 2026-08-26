/** 値があるときだけ使う (undefined の分岐をこの 1 か所に閉じる) */
export function ifDefined<T>(value: T | undefined, use: (value: T) => void): void {
  if (value !== undefined) {
    use(value);
  }
}
