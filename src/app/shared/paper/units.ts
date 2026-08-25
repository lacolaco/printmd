declare const MILLIMETER: unique symbol;
declare const PIXEL: unique symbol;

/** ミリメートル。紙面の寸法はこの単位で扱う */
export type Mm = number & { readonly [MILLIMETER]: true };

/** CSS ピクセル。画面の実測値はこの単位で扱う */
export type Px = number & { readonly [PIXEL]: true };

/** 1mm あたりの CSS px (96dpi 基準) */
const SCALE = 96 / 25.4;

export function mm(value: number): Mm {
  return value as Mm;
}

export function px(value: number): Px {
  return value as Px;
}

/** mm を CSS px へ換算する */
export function toPx(value: Mm): Px {
  return px(value * SCALE);
}
