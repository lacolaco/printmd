import type { Block, RenderedDocument } from './markdown/block-extractor';
import type { Pagination, SegmentRange } from './pagination';
import { Probe } from './probe';
import { Ranges } from './ranges';

/**
 * 強制改ページ (指定 Set とファイル境界) の位置で文書をセグメントへ分割する。
 * 画面の改ページは CSS の break-before に頼らず「セグメント = 独立した段組
 * ストリップ」で表現する。Firefox が段への強制改行を実装していないため、
 * どのエンジンでも起きる自然な流し込みだけに依存させる (印刷側は全エンジンが
 * 解する break-before: page のままクラスで表現する)
 */
export function splitAtForcedBreaks(
  blocks: readonly Block[],
  breaks: ReadonlySet<string>,
): SegmentRange[] {
  const ranges = new Ranges();
  blocks.forEach((block, index) => ranges.cut(block, index, breaks));
  return ranges.close(blocks.length);
}

/**
 * 文書が何ページ (= 段) に割り付くかをセグメントごとに実レイアウトで計測する。
 * 同一の (doc, breaks, CSS) に対して決定的で、プローブは即座に破棄する
 * ため観測可能な状態を残さない (computed の中から呼べる純粋関数として扱う)
 */
export function measurePagination(doc: RenderedDocument, breaks: ReadonlySet<string>): Pagination {
  const { blocks } = doc;
  const ranges = splitAtForcedBreaks(blocks, breaks);
  return new Probe().measure(doc, ranges);
}
