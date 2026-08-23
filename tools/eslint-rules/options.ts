/** ルール共通の { maxLines } オプションを読む */
export function maxLinesOption(
  context: { options: readonly unknown[] },
  fallback: number,
): number {
  const options = (context.options[0] ?? {}) as { maxLines?: number };
  return options.maxLines ?? fallback;
}
