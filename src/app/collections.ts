export function isNonEmpty(items: readonly unknown[]): boolean {
  return items.length > 0;
}

export function ifDefined<T>(value: T | undefined, use: (value: T) => void): void {
  if (value !== undefined) {
    use(value);
  }
}
