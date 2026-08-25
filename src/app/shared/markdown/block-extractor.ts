import { RenderedDocument } from './rendered-document';

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

  private spill(fragment: FileFragment): Element[] {
    const temp = document.createElement('div');
    temp.innerHTML = fragment.html;
    const children = [...temp.children];
    this.container.append(...temp.childNodes);
    return children;
  }

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
    return new RenderedDocument(this.container, this.blocks);
  }
}

export function buildRenderedDocument(fragments: readonly FileFragment[]): RenderedDocument {
  const assembler = new Assembler();
  fragments.forEach((fragment) => assembler.add(fragment));
  return assembler.result();
}

export { RenderedDocument } from './rendered-document';
