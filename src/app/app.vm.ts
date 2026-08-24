import { Injectable, inject } from '@angular/core';
import { Manuscripts } from './manuscript/manuscripts';

/** App のビューモデル。画面切替の問い合わせ */
@Injectable()
export class AppViewModel {
  private readonly manuscripts = inject(Manuscripts);

  readonly nonEmpty = this.manuscripts.nonEmpty;
}
