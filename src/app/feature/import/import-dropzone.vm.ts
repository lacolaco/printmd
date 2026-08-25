import { Injectable, inject } from '@angular/core';
import { BUNDLED_DEMOS } from './demo-manuscript';
import { Manuscripts } from '../../shared/manuscript/manuscripts';
import type { ImportSource } from '../../shared/manuscript/import-source';

/** ImportDropzone のビューモデル。取り込みとデモ読み込みの command */
@Injectable()
export class ImportDropzoneViewModel {
  private readonly manuscripts = inject(Manuscripts);

  /** 選択・ドロップされた入力を原稿として取り込む */
  add(sources: readonly ImportSource[]): Promise<void> {
    return this.manuscripts.add(sources);
  }

  /** 同梱デモ原稿を取り込む */
  loadDemo(): Promise<void> {
    return this.manuscripts.add(BUNDLED_DEMOS);
  }
}
