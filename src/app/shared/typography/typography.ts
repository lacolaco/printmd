import {
  Service,
  inject,
  signal,
  type EnvironmentProviders,
  type WritableSignal,
} from '@angular/core';
import { DEFAULT_SIZE } from './font-catalog';
import { provideLayoutSetting } from '../layout/style-variables';
import type { FontSize } from './font-size';

/**
 * 本文のベース文字サイズの選択。現在の段を保有する。
 * 段の刻みと段送りの算術は font-catalog に置く
 */
@Service()
export class Typography {
  /** 現在の段。Signal Forms の模型として書き込みも受ける */
  readonly size: WritableSignal<FontSize> = signal(DEFAULT_SIZE);

  /** 段を選び直す */
  select(size: FontSize): void {
    this.size.set(size);
  }
}

/** ベース文字サイズを画面 CSS の供給元として登録する */
export function provideBaseFontSize(): EnvironmentProviders {
  return provideLayoutSetting(() => {
    const source = inject(Typography);
    return () => source.size().variables();
  });
}
