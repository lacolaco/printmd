import { mm, toPx, type Mm, type Px } from './units';

/** 紙の物理寸法と四辺の余白 */
interface PageBox {
  readonly width: Mm;
  readonly height: Mm;
  readonly margin: Mm;
}

/** 版面 (余白を除いた印字領域) */
interface ContentBox {
  readonly width: Mm;
  readonly height: Mm;
}

/** 段間。紙ではなく画面上の隙間なので全書式で共通 */
const GAP = mm(16);

/**
 * 用紙書式。紙面の寸法を要する処理は書式ごとに分岐せず、この型へ問い合わせる
 */
export class PaperFormat {
  /** 版面 (余白を除いた印字領域) */
  readonly content: ContentBox;
  /** 多段組プレビューの段間 */
  readonly gap = GAP;
  /** 段 i の水平オフセット単位 = 版面幅 + 段間 */
  readonly step: Mm;

  constructor(
    /** 画面に出す書式名 */
    readonly label: string,
    readonly page: PageBox,
  ) {
    const { width, height, margin } = page;
    this.content = { width: mm(width - margin * 2), height: mm(height - margin * 2) };
    this.step = mm(this.content.width + GAP);
  }

  /** 段組ストリップの幅が何段 = 何ページになるか */
  pagesIn(scrollWidth: Px): number {
    const raw = (scrollWidth + toPx(GAP)) / toPx(this.step);
    return Math.max(1, Math.round(raw));
  }

  /** 段 i を窓から見せるための水平オフセット */
  offsetAt(column: number): Mm {
    return mm(column * this.step);
  }

  /** 紙の実寸。表示倍率が収まるかの判断に使う */
  widthPx(): Px {
    return toPx(this.page.width);
  }

  /** 画面 CSS が参照するカスタムプロパティ (名前と値の組) */
  variables(): readonly (readonly [string, string])[] {
    return VARIABLES.map(([name, read]) => [name, `${read(this)}mm`] as const);
  }
}

const VARIABLES: readonly (readonly [string, (paper: PaperFormat) => Mm])[] = [
  ['--page-width', (paper) => paper.page.width],
  ['--page-height', (paper) => paper.page.height],
  ['--page-margin', (paper) => paper.page.margin],
  ['--content-width', (paper) => paper.content.width],
  ['--content-height', (paper) => paper.content.height],
  ['--column-gap', (paper) => paper.gap],
];
