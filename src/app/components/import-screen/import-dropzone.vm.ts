import { Injectable, inject } from '@angular/core';
import { Demo } from './demo';
import { Manuscripts } from '../../manuscript/manuscripts';
import type { ImportSource } from '../../manuscript/manuscript';

/** ImportDropzone のビューモデル。取り込みとデモ読み込みの命令 */
@Injectable()
export class ImportDropzoneViewModel {
  private readonly manuscripts = inject(Manuscripts);
  private readonly demo = inject(Demo);

  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  loadDemo(): void {
    this.demo.load();
  }
}
