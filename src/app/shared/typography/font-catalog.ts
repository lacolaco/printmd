import { FontSize } from './font-size';

/** 選べる段の一覧 (画面に並べる順) */
export const SIZES: readonly FontSize[] = [9, 10, 10.5, 11, 12, 14].map((pt) => new FontSize(pt));

/** 既定の段。1pt = 4/3px なので 12pt はちょうど 16px (github-markdown-css の既定と一致) */
export const DEFAULT_SIZE = SIZES.find((size) => size.pt === 12)!;

function indexOf(size: FontSize): number {
  return SIZES.indexOf(size);
}

function stepped(index: number, delta: -1 | 1): number {
  return Math.min(SIZES.length - 1, Math.max(0, index + delta));
}

/** 段を delta ぶん送った次の段 (両端で頭打ち) */
export function steppedFrom(size: FontSize, delta: -1 | 1): FontSize {
  return SIZES[stepped(indexOf(size), delta)];
}

/** delta 方向へまだ段を送れるか */
export function isSteppable(size: FontSize, delta: -1 | 1): boolean {
  const index = indexOf(size);
  return delta === -1 ? index !== 0 : index !== SIZES.length - 1;
}
