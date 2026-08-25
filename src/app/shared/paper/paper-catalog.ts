import { PaperFormat } from './paper-format';
import { mm } from './units';

/** A4 (210×297mm) */
export const A4 = new PaperFormat('A4', {
  width: mm(210),
  height: mm(297),
  margin: mm(16),
});

/** A3 (297×420mm) */
export const A3 = new PaperFormat('A3', {
  width: mm(297),
  height: mm(420),
  margin: mm(20),
});
/** B5 (JIS 182×257mm。ISO B5 ではない) */
export const B5 = new PaperFormat('B5', {
  width: mm(182),
  height: mm(257),
  margin: mm(14),
});

/** 選べる書式の一覧 (画面に並べる順) */
export const PAPERS: readonly PaperFormat[] = [A4, A3, B5];

/** 既定の書式 */
export const DEFAULT_PAPER = A4;
