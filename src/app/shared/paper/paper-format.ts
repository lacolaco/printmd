import { MM_TO_PX } from './units';

/** 紙の物理寸法と四辺の余白 (単位 mm) */
interface PageBox {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
}

/** 版面 (余白を除いた印字領域、単位 mm) */
interface ContentBox {
  readonly width: number;
  readonly height: number;
}

/** 段間 (mm)。紙ではなく画面上の隙間なので全書式で共通 */
const GAP = 16;

/**
 * 用紙書式。紙面の寸法を要する処理は書式ごとに分岐せず、この型へ問い合わせる
 */
export class PaperFormat {
  /** 版面 (余白を除いた印字領域) */
  readonly content: ContentBox;
  /** 多段組プレビューの段間 (mm) */
  readonly gap = GAP;
  /** 段 i の水平オフセット単位 = 版面幅 + 段間 (mm) */
  readonly step: number;

  constructor(
    /** 画面に出す書式名 */
    readonly label: string,
    readonly page: PageBox,
  ) {
    const { width, height, margin } = page;
    this.content = { width: width - margin * 2, height: height - margin * 2 };
    this.step = this.content.width + GAP;
  }

  /** 段組ストリップの幅 (CSS px) が何段 = 何ページになるか */
  pagesIn(scrollWidth: number): number {
    const raw = (scrollWidth + GAP * MM_TO_PX) / (this.step * MM_TO_PX);
    return Math.max(1, Math.round(raw));
  }

  /** 段 i を窓から見せるための水平オフセット (mm) */
  offsetAt(column: number): number {
    return column * this.step;
  }

  /** 紙の実寸 (CSS px)。表示倍率が収まるかの判断に使う */
  widthPx(): number {
    return this.page.width * MM_TO_PX;
  }

  /** 画面 CSS が参照するカスタムプロパティ (名前と値の組) */
  variables(): readonly (readonly [string, string])[] {
    return VARIABLES.map(([name, read]) => [name, `${read(this)}mm`] as const);
  }
}

const VARIABLES: readonly (readonly [string, (paper: PaperFormat) => number])[] = [
  ['--page-width', (paper) => paper.page.width],
  ['--page-height', (paper) => paper.page.height],
  ['--page-margin', (paper) => paper.page.margin],
  ['--content-width', (paper) => paper.content.width],
  ['--content-height', (paper) => paper.content.height],
  ['--column-gap', () => GAP],
];
