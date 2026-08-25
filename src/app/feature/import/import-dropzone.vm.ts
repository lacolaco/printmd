import { Injectable, inject } from '@angular/core';
import { BUNDLED_DEMOS } from './demo-manuscript';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import type { ImportSource } from '../../shared/manuscript/manuscript';

/** ImportDropzone のビューモデル。取り込みとデモ読み込みの command */
@Injectable()
export class ImportDropzoneViewModel {
  private readonly manuscripts = inject(Manuscripts);

  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  loadDemo(): Promise<void> {
    return this.manuscripts.add(BUNDLED_DEMOS);
  }
}
