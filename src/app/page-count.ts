import type { Block, RenderedDocument } from './markdown/block-extractor';
import { A4_MM, MM_TO_PX } from './page-geometry';

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

interface BreakAccumulator {
  readonly ranges: SegmentRange[];
  start: number;
}

function recordBreak(
  acc: BreakAccumulator,
  block: Block,
  index: number,
  breaks: ReadonlySet<string>,
): void {
  if (index !== 0 && (block.isFileBoundary || breaks.has(block.id))) {
    acc.ranges.push({ start: acc.start, end: index });
    acc.start = index;
  }
}

/**
 * 強制改ページ (指定 Set とファイル境界) の位置で文書をセグメントへ分割する。
 * 画面の改ページは CSS の break-before に頼らず「セグメント = 独立した段組
 * ストリップ」で表現する。Firefox が段への強制改行を実装していないため、
 * どのエンジンでも起きる自然な流し込みだけに依存させる (印刷側は全エンジンが
 * 解する break-before: page のままクラスで表現する)
 */
function closeAccumulator(acc: BreakAccumulator, end: number): SegmentRange[] {
  acc.ranges.push({ start: acc.start, end });
  return acc.ranges;
}

export function splitAtForcedBreaks(
  blocks: readonly Block[],
  breaks: ReadonlySet<string>,
): SegmentRange[] {
  const acc: BreakAccumulator = { ranges: [], start: 0 };
  blocks.forEach((block, index) => recordBreak(acc, block, index, breaks));
  return closeAccumulator(acc, blocks.length);
}

function copyChildren(
  parent: HTMLElement,
  children: HTMLCollection,
  start: number,
  end: number,
): void {
  for (let index = start; index < end; index++) {
    parent.append(children[index].cloneNode(true));
  }
}

function mountParent(mc: HTMLElement, parent: HTMLElement): void {
  if (parent !== mc) {
    mc.append(parent);
  }
}

function assemble(mc: HTMLElement, parent: HTMLElement): HTMLElement {
  mountParent(mc, parent);
  return mc;
}

/**
 * セグメント範囲のブロックだけを複製した段組コンテナを作る。
 * 印刷は強制改ページ後もブロックの上マージンを保持するため、2 番目以降の
 * セグメントは先頭ブロックが .markdown-body > :first-child のマージン除去に
 * 当たらないようラッパで包む (先頭セグメントは文書先頭 = 除去が正)
 */
function emptyStrip(container: HTMLElement): HTMLElement {
  const mc = container.cloneNode(false) as HTMLElement;
  mc.className = 'mc markdown-body';
  return mc;
}

export function buildSegmentClone(doc: RenderedDocument, start: number, end: number): HTMLElement {
  const mc = emptyStrip(doc.container);
  const parent = start === 0 ? mc : document.createElement('div');
  copyChildren(parent, doc.container.children, start, end);
  return assemble(mc, parent);
}

function cloneInto(probe: HTMLElement, doc: RenderedDocument, range: SegmentRange): HTMLElement {
  const mc = buildSegmentClone(doc, range.start, range.end);
  probe.append(mc);
  return mc;
}

function probeShell(): HTMLElement {
  const probe = document.createElement('div');
  probe.className = 'preview-probe';
  return probe;
}

function createProbe(
  doc: RenderedDocument,
  ranges: readonly SegmentRange[],
): { probe: HTMLElement; clones: HTMLElement[] } {
  const probe = probeShell();
  const clones = ranges.map((range) => cloneInto(probe, doc, range));
  document.body.append(probe);
  return { probe, clones };
}

function pagesForScrollWidth(scrollWidth: number): number {
  const raw = (scrollWidth + A4_MM.column.gap * MM_TO_PX) / (A4_MM.column.step * MM_TO_PX);
  return Math.max(1, Math.round(raw));
}

interface SegmentAccumulator {
  readonly segments: PageSegment[];
  firstPage: number;
}

function accumulateSegment(acc: SegmentAccumulator, range: SegmentRange, clone: HTMLElement): void {
  const pages = pagesForScrollWidth(clone.scrollWidth);
  const segment: PageSegment = { ...range, pages, firstPage: acc.firstPage };
  acc.segments.push(segment);
  acc.firstPage += pages;
}

function summarize(acc: SegmentAccumulator): { segments: PageSegment[]; total: number } {
  return { segments: acc.segments, total: acc.firstPage };
}

function tallySegments(
  ranges: readonly SegmentRange[],
  clones: readonly HTMLElement[],
): { segments: PageSegment[]; total: number } {
  const acc: SegmentAccumulator = { segments: [], firstPage: 0 };
  ranges.forEach((range, index) => accumulateSegment(acc, range, clones[index]));
  return summarize(acc);
}

/**
 * 文書が何ページ (= 段) に割り付くかをセグメントごとに実レイアウトで計測する。
 * 同一の (doc, breaks, CSS) に対して決定的で、プローブは即座に破棄する
 * ため観測可能な状態を残さない (computed の中から呼べる純粋関数として扱う)
 */
export function measurePagination(doc: RenderedDocument, breaks: ReadonlySet<string>): Pagination {
  const { blocks } = doc;
  const ranges = splitAtForcedBreaks(blocks, breaks);
  const { probe, clones } = createProbe(doc, ranges);
  return finishMeasurement(probe, ranges, clones);
}

/** 計測してからプローブを破棄する (計測は必ず破棄より先) */
function finishMeasurement(
  probe: HTMLElement,
  ranges: readonly SegmentRange[],
  clones: readonly HTMLElement[],
): Pagination {
  const result = tallySegments(ranges, clones);
  probe.remove();
  return result;
}
