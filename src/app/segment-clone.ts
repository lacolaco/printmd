import type { RenderedDocument } from './markdown/block-extractor';

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
