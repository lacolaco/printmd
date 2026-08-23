import { Service, computed, signal } from '@angular/core';
import type { ManuscriptFile } from '../manuscript/manuscript';

/** 原稿ファイル列と取り込み警告。判断は持たず、置き換えを受けるだけ */
@Service()
export class ManuscriptState {
  private readonly manuscripts = signal<readonly ManuscriptFile[]>([]);
  private readonly notices = signal<readonly string[]>([]);

  readonly files = this.manuscripts.asReadonly();
  readonly warnings = this.notices.asReadonly();
  readonly nonEmpty = computed(() => this.files().length > 0);

  replace(files: readonly ManuscriptFile[]): void {
    this.manuscripts.set(files);
  }

  warn(warnings: readonly string[]): void {
    this.notices.set(warnings);
  }
}
