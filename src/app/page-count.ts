import type { Block, RenderedDocument } from './markdown/block-extractor';
import { COLUMN_GAP_MM, COLUMN_STEP_MM, MM_TO_PX } from './page-geometry';

/** 強制改ページで区切られた、連続するトップレベルブロックの範囲 [start, end) */
export interface SegmentRange {
  readonly start: number;
  readonly end: number;
}

export interface PageSegment extends SegmentRange {
  /** このセグメント単独のページ数 */
  readonly pages: number;
  /** 文書全体での開始ページ (0 始まり) */
  readonly firstPage: number;
}

export interface Pagination {
  readonly total: number;
  readonly segments: readonly PageSegment[];
}

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
  const ranges: SegmentRange[] = [];
  let start = 0;
  blocks.forEach((block, index) => {
    if (index === 0) return;
    if (block.isFileBoundary || breaks.has(block.id)) {
      ranges.push({ start, end: index });
      start = index;
    }
  });
  ranges.push({ start, end: blocks.length });
  return ranges;
}

/**
 * セグメント範囲のブロックだけを複製した段組コンテナを作る。
 * 印刷は強制改ページ後もブロックの上マージンを保持するため、2 番目以降の
 * セグメントは先頭ブロックが .markdown-body > :first-child のマージン除去に
 * 当たらないようラッパで包む (先頭セグメントは文書先頭 = 除去が正)
 */
export function buildSegmentClone(doc: RenderedDocument, start: number, end: number): HTMLElement {
  const mc = doc.container.cloneNode(false) as HTMLElement;
  mc.className = 'mc markdown-body';
  const parent = start === 0 ? mc : document.createElement('div');
  const children = doc.container.children;
  for (let index = start; index < end; index++) {
    parent.append(children[index].cloneNode(true));
  }
  if (parent !== mc) mc.append(parent);
  return mc;
}

/**
 * 文書が何ページ (= 段) に割り付くかをセグメントごとに実レイアウトで計測する。
 * 同一の (doc, breaks, CSS) に対して決定的で、プローブは即座に破棄する
 * ため観測可能な状態を残さない (computed の中から呼べる純粋関数として扱う)
 */
export function measurePagination(doc: RenderedDocument, breaks: ReadonlySet<string>): Pagination {
  const ranges = splitAtForcedBreaks(doc.blocks, breaks);
  const probe = document.createElement('div');
  probe.className = 'preview-probe';
  const clones = ranges.map((range) => {
    const mc = buildSegmentClone(doc, range.start, range.end);
    probe.append(mc);
    return mc;
  });
  document.body.append(probe);
  let firstPage = 0;
  const segments = ranges.map((range, index) => {
    const pages = Math.max(
      1,
      Math.round(
        (clones[index].scrollWidth + COLUMN_GAP_MM * MM_TO_PX) / (COLUMN_STEP_MM * MM_TO_PX),
      ),
    );
    const segment: PageSegment = { ...range, pages, firstPage };
    firstPage += pages;
    return segment;
  });
  probe.remove();
  return { total: firstPage, segments };
}
