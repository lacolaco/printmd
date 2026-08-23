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

interface BreakAccumulator {
  readonly ranges: SegmentRange[];
  start: number;
}

function collectBreak(
  acc: BreakAccumulator,
  block: Block,
  index: number,
  breaks: ReadonlySet<string>,
): void {
  if (index === 0) return;
  if (!block.isFileBoundary && !breaks.has(block.id)) return;
  acc.ranges.push({ start: acc.start, end: index });
  acc.start = index;
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
  blocks.forEach((block, index) => collectBreak(acc, block, index, breaks));
  return closeAccumulator(acc, blocks.length);
}

function appendClonedChildren(
  parent: HTMLElement,
  children: HTMLCollection,
  start: number,
  end: number,
): void {
  for (let index = start; index < end; index++) {
    parent.append(children[index].cloneNode(true));
  }
}

function attachClone(mc: HTMLElement, parent: HTMLElement): HTMLElement {
  if (parent !== mc) mc.append(parent);
  return mc;
}

/**
 * セグメント範囲のブロックだけを複製した段組コンテナを作る。
 * 印刷は強制改ページ後もブロックの上マージンを保持するため、2 番目以降の
 * セグメントは先頭ブロックが .markdown-body > :first-child のマージン除去に
 * 当たらないようラッパで包む (先頭セグメントは文書先頭 = 除去が正)
 */
function createSegmentContainer(container: HTMLElement): HTMLElement {
  const mc = container.cloneNode(false) as HTMLElement;
  mc.className = 'mc markdown-body';
  return mc;
}

export function buildSegmentClone(doc: RenderedDocument, start: number, end: number): HTMLElement {
  const mc = createSegmentContainer(doc.container);
  const parent = start === 0 ? mc : document.createElement('div');
  appendClonedChildren(parent, doc.container.children, start, end);
  return attachClone(mc, parent);
}

function appendSegmentClone(
  probe: HTMLElement,
  doc: RenderedDocument,
  range: SegmentRange,
): HTMLElement {
  const mc = buildSegmentClone(doc, range.start, range.end);
  probe.append(mc);
  return mc;
}

function createProbeElement(): HTMLElement {
  const probe = document.createElement('div');
  probe.className = 'preview-probe';
  return probe;
}

function createProbe(
  doc: RenderedDocument,
  ranges: readonly SegmentRange[],
): { probe: HTMLElement; clones: HTMLElement[] } {
  const probe = createProbeElement();
  const clones = ranges.map((range) => appendSegmentClone(probe, doc, range));
  document.body.append(probe);
  return { probe, clones };
}

function pagesForScrollWidth(scrollWidth: number): number {
  const raw = (scrollWidth + COLUMN_GAP_MM * MM_TO_PX) / (COLUMN_STEP_MM * MM_TO_PX);
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

function collectSegments(acc: SegmentAccumulator): { segments: PageSegment[]; total: number } {
  return { segments: acc.segments, total: acc.firstPage };
}

function buildSegments(
  ranges: readonly SegmentRange[],
  clones: readonly HTMLElement[],
): { segments: PageSegment[]; total: number } {
  const acc: SegmentAccumulator = { segments: [], firstPage: 0 };
  ranges.forEach((range, index) => accumulateSegment(acc, range, clones[index]));
  return collectSegments(acc);
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
  const result = buildSegments(ranges, clones);
  probe.remove();
  return result;
}
