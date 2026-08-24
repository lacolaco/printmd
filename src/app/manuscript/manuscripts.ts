import { Service, computed, inject, signal } from '@angular/core';
import { isNonEmpty } from '../collections';
import { FileOrder } from './file-order';
import { Importer } from './importer';
import type { ImportSource, ManuscriptFile } from './manuscript';

function removedFrom(current: readonly ManuscriptFile[], id: number): readonly ManuscriptFile[] {
  const remaining = current.filter((f) => f.id !== id);
  return remaining.length === current.length ? current : remaining;
}

/** 原稿。ファイル列と取り込み警告を保有し、取り込み・削除・並べ替えを担う */
@Service()
export class Manuscripts {
  private readonly importer = inject(Importer);
  private readonly list = signal<readonly ManuscriptFile[]>([]);
  private readonly notices = signal<readonly string[]>([]);

  readonly files = this.list.asReadonly();
  readonly warnings = this.notices.asReadonly();
  readonly nonEmpty = computed(() => this.files().length > 0);

  async add(sources: readonly ImportSource[]): Promise<void> {
    if (isNonEmpty(sources)) {
      const { files, warnings } = await this.importer.read(sources);
      this.notices.set(warnings);
      this.append(files);
    }
  }

  private append(files: readonly ManuscriptFile[]): void {
    if (isNonEmpty(files)) {
      this.list.set([...this.files(), ...files]);
    }
  }

  remove(id: number): void {
    const current = this.files();
    this.replaceIfChanged(current, removedFrom(current, id));
  }

  isMovable(id: number, delta: -1 | 1): boolean {
    return new FileOrder(this.files()).isNudgeable(id, delta);
  }

  isReorderable(from: number, to: number): boolean {
    return new FileOrder(this.files()).isMovable(from, to);
  }

  /** ファイルを 1 つ上/下へ動かす。動けるかは isMovable で先に問い合わせる */
  nudge(id: number, delta: -1 | 1): void {
    const index = this.files().findIndex((f) => f.id === id);
    this.reorder(index, index + delta);
  }

  reorder(from: number, to: number): void {
    const current = this.files();
    this.replaceIfChanged(current, new FileOrder(current).reordered(from, to));
  }

  private replaceIfChanged(
    current: readonly ManuscriptFile[],
    next: readonly ManuscriptFile[],
  ): void {
    if (next !== current) {
      this.list.set(next);
    }
  }
}
