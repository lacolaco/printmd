import { Injectable, inject, type Signal } from '@angular/core';
import { Manuscripts } from '../../shared/manuscript/manuscripts';

/** Header のビューモデル。印刷ボタンの出し分け (原稿有無) の問い合わせ */
@Injectable()
export class HeaderViewModel {
  private readonly manuscripts = inject(Manuscripts);

  /** 印刷ボタンを出すか (原稿があるか) */
  readonly isActive: Signal<boolean> = this.manuscripts.isNonEmpty;
}
