import { Service, computed, inject, signal } from '@angular/core';
import { isNonEmpty } from '../collections';
import { FileOrder } from '../manuscript/file-order';
import { Importer } from '../manuscript/importer';
import type { ImportSource, ManuscriptFile } from '../manuscript/manuscript';

/** 原稿ファイル列と取り込み警告。原稿は書き換えない (追加・削除・並べ替えのみ) */
@Service()
export class ManuscriptState {
  private readonly importer = inject(Importer);

  private readonly manuscripts = signal<readonly ManuscriptFile[]>([]);
  private readonly notices = signal<readonly string[]>([]);

  readonly files = this.manuscripts.asReadonly();
  readonly warnings = this.notices.asReadonly();
  readonly nonEmpty = computed(() => this.files().length > 0);

  async addFiles(sources: readonly ImportSource[]): Promise<void> {
    if (isNonEmpty(sources)) {
      const { files, warnings } = await this.importer.read(sources);
      this.notices.set(warnings);
      this.append(files);
    }
  }

  private append(files: readonly ManuscriptFile[]): void {
    if (isNonEmpty(files)) {
      this.manuscripts.update((current) => [...current, ...files]);
    }
  }

  removeFile(id: number): void {
    this.manuscripts.update((current) =>
      current.some((f) => f.id === id) ? current.filter((f) => f.id !== id) : current,
    );
  }

  isMovable(id: number, delta: -1 | 1): boolean {
    return new FileOrder(this.manuscripts()).isNudgeable(id, delta);
  }

  isReorderable(from: number, to: number): boolean {
    return new FileOrder(this.manuscripts()).isMovable(from, to);
  }

  /** ファイルを 1 つ上/下へ動かす。動けるかは isMovable で先に問い合わせる */
  nudge(id: number, delta: -1 | 1): void {
    const index = this.manuscripts().findIndex((f) => f.id === id);
    this.reorder(index, index + delta);
  }

  reorder(from: number, to: number): void {
    this.manuscripts.update((current) => new FileOrder(current).reordered(from, to));
  }
}
