import { FontSize } from './font-size';
import { Steps } from '../support/steps';

/** 既定の段。1pt = 4/3px なので 12pt はちょうど 16px (github-markdown-css の既定と一致) */
export const DEFAULT_SIZE = new FontSize(12);

/** 選べる段の一覧 (小さい順) と段送り */
export const SIZES = new Steps(
  [
    new FontSize(9),
    new FontSize(10),
    new FontSize(10.5),
    new FontSize(11),
    DEFAULT_SIZE,
    new FontSize(14),
  ],
  (size) => size.label,
);
