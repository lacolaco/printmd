import { PaperFormat } from './paper-format';

/** A4 (210×297mm) */
export const A4 = new PaperFormat('a4', 'A4', { width: 210, height: 297, margin: 16 });
/** A3 (297×420mm) */
export const A3 = new PaperFormat('a3', 'A3', { width: 297, height: 420, margin: 20 });
/** B5 (JIS 182×257mm。ISO B5 ではない) */
export const B5 = new PaperFormat('b5', 'B5', { width: 182, height: 257, margin: 14 });

/** 選べる書式の一覧 (画面に並べる順) */
export const PAPERS: readonly PaperFormat[] = [A4, A3, B5];

/** 既定の書式 */
export const FALLBACK = A4;
