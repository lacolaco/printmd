import { DOCUMENT, Service, effect, inject, signal, type WritableSignal } from '@angular/core';

/**
 * 本文のベース文字サイズの下限・上限・刻み (単位 pt)。
 * 0.5pt は組版で本文の詰まりを調整するときの刻みである。
 * 9pt は本文として組める下限、24pt は本文として扱える上限
 */
export const FONT_SIZE = { min: 9, max: 24, step: 0.5 } as const;

/** 既定。1pt = 4/3px なので 12pt はちょうど 16px (github-markdown-css の既定と一致) */
const INITIAL = 12;

function clamped(pt: number): number {
  return Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, pt));
}

/** 本文のベース文字サイズ (単位 pt)。現在の値を保有し、画面 CSS へ反映する */
@Service()
export class Typography {
  private readonly root = inject(DOCUMENT).documentElement;

  /** 現在の文字サイズ。刻みに乗らない値も受ける */
  readonly size: WritableSignal<number> = signal(INITIAL);

  constructor() {
    // 最初の計測より前に値を置く。CSS 側に既定を書くと定義が 2 か所に分かれる
    this.write(this.size());
    // ここは DOM 書き込みのみ
    effect(() => this.write(this.size()));
  }

  /** delta ぶん刻みを進める (下限と上限で頭打ち) */
  changeBy(delta: -1 | 1): void {
    this.size.set(clamped(this.size() + delta * FONT_SIZE.step));
  }

  /** delta 方向へまだ変えられるか */
  isChangeable(delta: -1 | 1): boolean {
    return clamped(this.size() + delta * FONT_SIZE.step) !== this.size();
  }

  private write(pt: number): void {
    this.root.style.setProperty('--base-font-size', `${pt}pt`);
  }
}
