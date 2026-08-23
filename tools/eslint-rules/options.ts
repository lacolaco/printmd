import type { Rule } from 'eslint';

/** ルール共通の { maxLines } オプションを読む */
export function maxLinesOption(context: Rule.RuleContext, fallback: number): number {
  const options = (context.options[0] ?? {}) as { maxLines?: number };
  return options.maxLines ?? fallback;
}
