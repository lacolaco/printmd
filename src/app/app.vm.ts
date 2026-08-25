import { Injectable, inject, type Signal } from '@angular/core';
import { Manuscripts } from './shared/manuscript/manuscripts';

/** App のビューモデル。画面切替の問い合わせ */
@Injectable()
export class AppViewModel {
  private readonly manuscripts = inject(Manuscripts);

  /** 原稿があるか。空状態と作業画面の切替に使う */
  readonly isNonEmpty: Signal<boolean> = this.manuscripts.isNonEmpty;
}
