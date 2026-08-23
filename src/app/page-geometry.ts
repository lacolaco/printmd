/**
 * ページ寸法の単一の情報源。プレビューの段組計算 (preview.ts)・画面 CSS
 * (カスタムプロパティ経由)・e2e の座標計算はすべてここを参照する。
 * 例外: styles.css の @page ルールだけは規則内 var() の互換性が不確かなため
 * リテラルで書かれている (値を変えるときはそちらも追随させること)
 */

/** A4 の紙寸法と四辺の余白 */
const page = { width: 210, height: 297, margin: 16 } as const;
/** 版面 (余白を除いた印字領域) */
const content = { width: page.width - page.margin * 2, height: page.height - page.margin * 2 };
/** 多段組プレビューの段間と、段 i の水平オフセット単位 (版面幅 + 段間) */
const gap = 16;
const column = { gap, step: content.width + gap };

/** 紙面の全寸法 (単位 mm) */
export const A4 = { page, content, column } as const;

/** 1mm を CSS px に換算する係数 (96dpi 基準) */
export const MM_TO_PX = 96 / 25.4;

const CSS_VARIABLES: readonly (readonly [name: string, valueMm: number])[] = [
  ['--page-width', page.width],
  ['--page-height', page.height],
  ['--page-margin', page.margin],
  ['--content-width', content.width],
  ['--content-height', content.height],
  ['--column-gap', column.gap],
];

/** 画面 CSS が参照するカスタムプロパティとして定義値を注入する */
export function applyGeometryStyles(root: HTMLElement): void {
  CSS_VARIABLES.forEach(([name, valueMm]) => root.style.setProperty(name, `${valueMm}mm`));
}
