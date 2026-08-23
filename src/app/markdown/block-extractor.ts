import { ifDefined } from '../collections';

export type BlockKind =
  | 'heading'
  | 'paragraph'
  | 'table'
  | 'code'
  | 'mermaid'
  | 'blockquote'
  | 'list'
  | 'hr'
  | 'html'
  | 'other';

const KIND_BY_TAG: Readonly<Record<string, BlockKind>> = {
  H1: 'heading',
  H2: 'heading',
  H3: 'heading',
  H4: 'heading',
  H5: 'heading',
  H6: 'heading',
  P: 'paragraph',
  TABLE: 'table',
  PRE: 'code',
  BLOCKQUOTE: 'blockquote',
  UL: 'list',
  OL: 'list',
  HR: 'hr',
};

const LABEL_MAX_LENGTH = 28;

/** 改ページ調整パネルに表示する 1 ブロックの情報 */
export interface Block {
  readonly id: string;
  readonly kind: BlockKind;
  readonly label: string;
  readonly level: number | null;
  readonly fileIndex: number;
  readonly fileName: string;
  /** 2 番目以降のファイルの先頭ブロックか (常に強制改ページになる境界) */
  readonly isFileBoundary: boolean;
}

/** 1 ファイル分の変換済み HTML (mermaid の SVG 化・置換は呼び出し側で完了している前提) */
export interface FileFragment {
  readonly fileIndex: number;
  readonly fileName: string;
  readonly html: string;
}

export interface RenderedDocument {
  readonly container: HTMLElement;
  readonly blocks: readonly Block[];
}

function isMermaidFigure(el: Element): boolean {
  // mermaid 由来かは applyMermaidResults が付ける class で判定する
  // (生 HTML の figure も許可しているため、タグでは判別できない)
  return el.tagName === 'FIGURE' && el.classList.contains('mermaid');
}

function classify(el: Element): BlockKind {
  const { tagName } = el;
  return isMermaidFigure(el) ? 'mermaid' : (KIND_BY_TAG[tagName] ?? 'other');
}

function headingLevel(el: Element): number | null {
  const match = /^H([1-6])$/.exec(el.tagName);
  return match ? Number(match[1]) : null;
}

function captionFor(el: Element): string {
  return isMermaidFigure(el) ? 'mermaid 図' : bodyText(el);
}

function clip(text: string): string {
  return text.length > LABEL_MAX_LENGTH ? text.slice(0, LABEL_MAX_LENGTH) : text;
}

function bodyText(el: Element): string {
  const text = (el.textContent ?? '').trim().replaceAll(/\s+/g, ' ');
  return el.tagName === 'HR' ? '———' : clip(text);
}

/** 著者が書いた id (アンカー) を潰さないよう、ブロック ID は data 属性で持つ */
function stampId(el: Element, id: string): void {
  el.setAttribute('data-block-id', id);
}

/**
 * 複数ファイルの HTML 断片を 1 つの変換済み文書の要素へ結合し、トップレベル要素に
 * id="f{fileIndex}b{blockIndex}" を付与する。ID の連番はファイルごとに振り直す
 */
class Assembler {
  private readonly container = document.createElement('div');
  private readonly blocks: Block[] = [];

  constructor() {
    this.container.className = 'markdown-body';
  }

  add(fragment: FileFragment): void {
    const children = this.spill(fragment);
    children.forEach((el, position) => this.blocks.push(this.toBlock(fragment, el, position)));
  }

  /** 断片の HTML を要素化して container へ移し、トップレベル要素の一覧を返す */
  private spill(fragment: FileFragment): Element[] {
    const temp = document.createElement('div');
    temp.innerHTML = fragment.html;
    const children = [...temp.children];
    this.container.append(...temp.childNodes);
    return children;
  }

  /** トップレベル要素 1 つぶんの Block を組み立て、data-block-id を付与する */
  private toBlock(fragment: FileFragment, el: Element, position: number): Block {
    const { fileIndex } = fragment;
    const id = `f${fileIndex}b${position}`;
    stampId(el, id);
    const meta = { kind: classify(el), label: captionFor(el), level: headingLevel(el) };
    return { id, ...meta, ...this.originOf(fragment, position) };
  }

  private originOf(
    fragment: FileFragment,
    position: number,
  ): Pick<Block, 'fileIndex' | 'fileName' | 'isFileBoundary'> {
    const { fileIndex: origin, fileName: name } = fragment;
    return { fileIndex: origin, fileName: name, isFileBoundary: origin > 0 && position === 0 };
  }

  result(): RenderedDocument {
    return { container: this.container, blocks: this.blocks };
  }
}

export function buildRenderedDocument(fragments: readonly FileFragment[]): RenderedDocument {
  const assembler = new Assembler();
  fragments.forEach((fragment) => assembler.add(fragment));
  return assembler.result();
}

/**
 * 強制改ページ (指定 Set とファイル境界) を container のトップレベル要素へ
 * クラスとして反映する。冪等 (toggle) なので何度適用してもよい。
 * 呼び出しは各消費者の描画時に行う。派生値 (computed) の読み取りに
 * DOM 変異の副作用を持ち込まないための取り決め
 */
export function applyForcedBreaks(
  container: HTMLElement,
  blocks: readonly Block[],
  breaks: ReadonlySet<string>,
): void {
  [...container.children].forEach((el, index) =>
    ifDefined(blocks[index], (block) =>
      el.classList.toggle('forced-break', block.isFileBoundary || breaks.has(block.id)),
    ),
  );
}
