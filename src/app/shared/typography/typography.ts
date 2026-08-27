import { DOCUMENT, Service, effect, inject, signal, type WritableSignal } from '@angular/core';
import { SIZES } from './font-catalog';
import type { FontSize } from './font-size';

/** 本文のベース文字サイズ。現在の値を保有し、画面 CSS へ反映する */
@Service()
export class Typography {
  private readonly root = inject(DOCUMENT).documentElement;

  /** 現在の文字サイズ。操作面からの書き込みも受ける */
  readonly size: WritableSignal<FontSize> = signal(SIZES.initial);

  constructor() {
    // 最初の計測より前に値を置く。CSS 側に既定を書くと font-catalog と二重になる
    this.write(this.size());
    // ここは DOM 書き込みのみ
    effect(() => this.write(this.size()));
  }

  /** delta ぶん隣の文字サイズへ変える (両端で止まる) */
  changeBy(delta: -1 | 1): void {
    this.size.set(SIZES.next(this.size(), delta));
  }

  private write(size: FontSize): void {
    const { style } = this.root;
    size.variables().forEach(([name, value]) => style.setProperty(name, value));
  }
}
