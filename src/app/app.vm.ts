import { Injectable, inject, type Signal } from '@angular/core';
import { Manuscripts } from './shared/manuscript/manuscripts';

/** App のビューモデル。画面切替の問い合わせ */
@Injectable()
export class AppViewModel {
  private readonly manuscripts = inject(Manuscripts);

  readonly nonEmpty: Signal<boolean> = this.manuscripts.nonEmpty;
}
