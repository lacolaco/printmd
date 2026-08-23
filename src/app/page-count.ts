import type { Block, RenderedDocument } from './markdown/block-extractor';
import { A4, MM_TO_PX } from './page-geometry';

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

/** 強制改ページ位置で切った [start, end) の並び。切断判定と締めを閉じる */
class Ranges {
  private readonly items: SegmentRange[] = [];
  private start = 0;

  cut(block: Block, index: number, breaks: ReadonlySet<string>): void {
    if (index !== 0 && (block.isFileBoundary || breaks.has(block.id))) {
      this.items.push({ start: this.start, end: index });
      this.start = index;
    }
  }

  close(end: number): SegmentRange[] {
    this.items.push({ start: this.start, end });
    return this.items;
  }
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
  const ranges = new Ranges();
  blocks.forEach((block, index) => ranges.cut(block, index, breaks));
  return ranges.close(blocks.length);
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

/** 計測用の使い捨て DOM。生成・複製の掲示・計測・破棄を 1 か所に閉じる */
class Probe {
  private readonly host = document.createElement('div');

  constructor() {
    this.host.className = 'preview-probe';
  }

  /** 全クローンの構築後に掲示し、計測してから自身を破棄する (計測は必ず破棄より先) */
  measure(doc: RenderedDocument, ranges: readonly SegmentRange[]): Pagination {
    const clones = this.mount(doc, ranges);
    document.body.append(this.host);
    const result = tallySegments(ranges, clones);
    this.host.remove();
    return result;
  }

  private mount(doc: RenderedDocument, ranges: readonly SegmentRange[]): HTMLElement[] {
    return ranges.map((range) => this.adopt(buildSegmentClone(doc, range.start, range.end)));
  }

  private adopt(clone: HTMLElement): HTMLElement {
    this.host.append(clone);
    return clone;
  }
}

function pagesForScrollWidth(scrollWidth: number): number {
  const raw = (scrollWidth + A4.column.gap * MM_TO_PX) / (A4.column.step * MM_TO_PX);
  return Math.max(1, Math.round(raw));
}

/** セグメントごとのページ数を積み上げ、開始ページと総数を導く */
class Tally {
  private readonly segments: PageSegment[] = [];
  private firstPage = 0;

  absorb(range: SegmentRange, clone: HTMLElement): void {
    const pages = pagesForScrollWidth(clone.scrollWidth);
    this.segments.push({ ...range, pages, firstPage: this.firstPage });
    this.firstPage += pages;
  }

  result(): Pagination {
    return { segments: this.segments, total: this.firstPage };
  }
}

function tallySegments(
  ranges: readonly SegmentRange[],
  clones: readonly HTMLElement[],
): Pagination {
  const tally = new Tally();
  ranges.forEach((range, index) => tally.absorb(range, clones[index]));
  return tally.result();
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
