import { FontSize } from './font-size';
import { Steps } from '../support/steps';

/** 選べる段の一覧 (小さい順) と段送り */
export const SIZES = new Steps(
  [9, 10, 10.5, 11, 12, 14].map((pt) => new FontSize(pt)),
  (size) => size.label,
);

/** 既定の段。1pt = 4/3px なので 12pt はちょうど 16px (github-markdown-css の既定と一致) */
export const DEFAULT_SIZE: FontSize = SIZES.items.find((size) => size.pt === 12)!;
