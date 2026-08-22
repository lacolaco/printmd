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

function toKind(el: Element): BlockKind {
  if (isMermaidFigure(el)) return 'mermaid';
  return KIND_BY_TAG[el.tagName] ?? 'other';
}

function toLevel(el: Element): number | null {
  const match = /^H([1-6])$/.exec(el.tagName);
  return match ? Number(match[1]) : null;
}

function toLabel(el: Element): string {
  if (el.tagName === 'HR') return '———';
  if (isMermaidFigure(el)) return 'mermaid 図';
  const text = (el.textContent ?? '').trim().replaceAll(/\s+/g, ' ');
  return text.length > LABEL_MAX_LENGTH ? text.slice(0, LABEL_MAX_LENGTH) : text;
}

/**
 * 複数ファイルの HTML 断片を 1 つの変換済み文書の要素へ結合し、トップレベル要素に
 * id="f{fileIndex}b{blockIndex}" を付与する。ID の連番はファイルごとに振り直す。
 */
export function buildRenderedDocument(fragments: readonly FileFragment[]): RenderedDocument {
  const container = document.createElement('div');
  container.className = 'markdown-body';
  const blocks: Block[] = [];

  fragments.forEach((fragment) => {
    const temp = document.createElement('div');
    temp.innerHTML = fragment.html;
    [...temp.children].forEach((el, blockIndex) => {
      const id = `f${fragment.fileIndex}b${blockIndex}`;
      // 著者が書いた id (アンカー) を潰さないよう、ブロック ID は data 属性で持つ
      el.setAttribute('data-block-id', id);
      blocks.push({
        id,
        kind: toKind(el),
        label: toLabel(el),
        level: toLevel(el),
        fileIndex: fragment.fileIndex,
        fileName: fragment.fileName,
        isFileBoundary: fragment.fileIndex > 0 && blockIndex === 0,
      });
    });
    container.append(...temp.childNodes);
  });

  return { container, blocks };
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
  [...container.children].forEach((el, index) => {
    const block = blocks[index];
    if (block === undefined) return;
    el.classList.toggle('forced-break', block.isFileBoundary || breaks.has(block.id));
  });
}
