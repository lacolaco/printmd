import type { RenderedDocument } from '../markdown/rendered-document';
import type { PaperFormat } from '../paper/paper-format';
import type { Pagination } from './pagination';
import { MeasuringArea } from './measuring-area';
import { splitAtForcedBreaks } from './segment-ranges';

/**
 * 文書が何ページ (= 段) に割り付くかをセグメントごとに実レイアウトで計測する。
 * 同一の (doc, breaks, 書式) に対して決定的で、領域は即座に破棄する
 * ため観測可能な状態を残さない (computed の中から呼べる純粋関数として扱う)
 */
export function measurePagination(
  doc: RenderedDocument,
  breaks: ReadonlySet<string>,
  format: PaperFormat,
): Pagination {
  const { blocks } = doc;
  const ranges = splitAtForcedBreaks(blocks, breaks);
  return new MeasuringArea().measure(doc, ranges, format);
}
