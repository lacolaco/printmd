import { Service, inject, signal, type WritableSignal } from '@angular/core';
import { SIZES } from './font-catalog';
import { StyleVariables } from '../layout/style-variables';
import type { FontSize } from './font-size';

/** 本文のベース文字サイズ。現在の値を保有し、前後への変更を担う */
@Service()
export class Typography {
  /** 現在の文字サイズ。Signal Forms の模型として書き込みも受ける */
  readonly size: WritableSignal<FontSize> = signal(SIZES.initial);

  constructor() {
    inject(StyleVariables).register(() => this.size().variables());
  }

  /** delta ぶん隣の文字サイズへ変える (両端で止まる) */
  changeBy(delta: -1 | 1): void {
    this.size.set(SIZES.next(this.size(), delta));
  }
}
