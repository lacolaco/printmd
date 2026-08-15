import type { MasterDocument } from './markdown/block-extractor';
import { applyForcedBreaks } from './markdown/block-extractor';
import { COLUMN_GAP_MM, COLUMN_STEP_MM, MM_TO_PX } from './page-geometry';

/**
 * マスター文書の段組クローンを作る。ページ数の計測とプレビューのシート窓の
 * 両方がこの複製を使う (改ページクラスは描画時にここで適用する)
 */
export function buildColumnClone(
  master: MasterDocument,
  breaks: ReadonlySet<string>,
): HTMLElement {
  const mc = master.container.cloneNode(true) as HTMLElement;
  mc.className = 'mc markdown-body';
  applyForcedBreaks(mc, master.blocks, breaks);
  return mc;
}

/**
 * 文書が何ページ (= 段) に割り付くかを実レイアウトで計測する。
 * 同一の (master, breaks, CSS) に対して決定的で、プローブは即座に破棄する
 * ため観測可能な状態を残さない — computed の中から呼べる純粋関数として扱う
 */
export function measurePageCount(master: MasterDocument, breaks: ReadonlySet<string>): number {
  const probe = document.createElement('div');
  probe.className = 'preview-probe';
  const probeMc = buildColumnClone(master, breaks);
  probe.append(probeMc);
  document.body.append(probe);
  const count = Math.max(
    1,
    Math.round((probeMc.scrollWidth + COLUMN_GAP_MM * MM_TO_PX) / (COLUMN_STEP_MM * MM_TO_PX)),
  );
  probe.remove();
  return count;
}
