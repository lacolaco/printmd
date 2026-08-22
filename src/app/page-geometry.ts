/**
 * ページ寸法の単一の情報源。プレビューの段組計算 (preview.ts)・画面 CSS
 * (カスタムプロパティ経由)・e2e の座標計算はすべてここを参照する。
 * 例外: styles.css の @page ルールだけは規則内 var() の互換性が不確かなため
 * リテラルで書かれている (値を変えるときはそちらも追随させること)
 */

/** A4 の紙寸法 */
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
/** 四辺の余白 */
export const PAGE_MARGIN_MM = 16;
/** 版面 (余白を除いた印字領域) */
export const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
/** 多段組プレビューの段間 */
export const COLUMN_GAP_MM = 16;
/** 段 i の水平オフセット単位 (版面幅 + 段間) */
export const COLUMN_STEP_MM = CONTENT_WIDTH_MM + COLUMN_GAP_MM;
/** 1mm を CSS px に換算する係数 (96dpi 基準) */
export const MM_TO_PX = 96 / 25.4;

const CSS_VARIABLES: readonly (readonly [name: string, valueMm: number])[] = [
  ['--page-width', PAGE_WIDTH_MM],
  ['--page-height', PAGE_HEIGHT_MM],
  ['--page-margin', PAGE_MARGIN_MM],
  ['--content-width', CONTENT_WIDTH_MM],
  ['--content-height', CONTENT_HEIGHT_MM],
  ['--column-gap', COLUMN_GAP_MM],
];

/** 画面 CSS が参照するカスタムプロパティとして定義値を注入する */
export function applyPageGeometryCssVariables(root: HTMLElement): void {
  CSS_VARIABLES.forEach(([name, valueMm]) => root.style.setProperty(name, `${valueMm}mm`));
}
