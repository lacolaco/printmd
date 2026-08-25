import { PaperFormat } from './paper-format';
import { mm } from './units';

/** A4 (210×297mm) */
export const A4 = new PaperFormat('A4', {
  width: mm(210),
  height: mm(297),
  margin: mm(16),
});

/** 選べる書式の一覧 (画面に並べる順) */
export const PAPERS: readonly PaperFormat[] = [A4];

/** 既定の書式 */
export const DEFAULT_PAPER = A4;
