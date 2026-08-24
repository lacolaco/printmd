import { Injectable, inject } from '@angular/core';
import { Manuscripts } from './manuscript/manuscripts';
import type { ImportSource } from './manuscript/manuscript';

/** App のビューモデル。画面切替の問い合わせと、ウィンドウドロップの取り込み命令 */
@Injectable()
export class AppViewModel {
  private readonly manuscripts = inject(Manuscripts);

  readonly nonEmpty = this.manuscripts.nonEmpty;

  add(sources: readonly ImportSource[]): void {
    void this.manuscripts.add(sources);
  }
}
