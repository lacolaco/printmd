import { Injectable, inject } from '@angular/core';
import { DemoManuscript } from './demo-manuscript';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import type { ImportSource } from '../../shared/manuscript/manuscript';

/** ImportDropzone のビューモデル。取り込みとデモ読み込みの command */
@Injectable()
export class ImportDropzoneViewModel {
  private readonly manuscripts = inject(Manuscripts);
  /** ガイド + 著作権消滅作品の長文 (public/demo/ に同梱) */
  private readonly catalog = ['printmd-guide.md', 'hashire-merosu.md'].map(
    (name) => new DemoManuscript(name),
  );

  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  loadDemo(): Promise<void> {
    return this.manuscripts.add(this.catalog);
  }
}
