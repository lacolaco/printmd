import { Injectable, computed, inject } from '@angular/core';
import { Document } from '../../document';
import { Manuscripts } from '../../manuscript/manuscripts';
import { Zoom } from '../../pagination/zoom';

/** Header のビューモデル。表示操作の可視判断・頁数文言・段送りの問い合わせと命令 */
@Injectable()
export class HeaderViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly document = inject(Document);
  private readonly zoom = inject(Zoom);

  readonly active = this.manuscripts.nonEmpty;
  readonly zoomLabel = this.zoom.label;

  readonly status = computed(() => {
    const count = this.document.pageCount();
    return this.document.rendering() ? '変換中…' : count === 0 ? '—' : `${count}ページ`;
  });

  isSteppable(delta: -1 | 1): boolean {
    return this.zoom.isSteppable(delta);
  }

  stepBy(delta: -1 | 1): void {
    this.zoom.stepBy(delta);
  }
}
