import { PaperFormat } from './paper-format';

/** A4 (210×297mm) */
export const A4 = new PaperFormat('A4', { width: 210, height: 297, margin: 16 });

/** 選べる書式の一覧 (画面に並べる順) */
export const PAPERS: readonly PaperFormat[] = [A4];

/** 既定の書式 */
export const DEFAULT_PAPER = A4;
